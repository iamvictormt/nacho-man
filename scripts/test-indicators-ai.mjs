import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import ts from "typescript"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
const requireDependency = createRequire(import.meta.url)
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))

function load(file, mocks = {}) {
  const filename = path.resolve(scriptDirectory, "..", file)
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText
  const module = { exports: {} }
  new Function("require", "module", "exports", code)(
    (id) => (id in mocks ? mocks[id] : requireDependency(id)),
    module,
    module.exports
  )
  return module.exports
}
const { analysisInput } = load("lib/saipos/analysis-input.ts")
const valid = {
  question: "Compare o faturamento das lojas.",
  store: "all",
  start: "2025-05-01",
  end: "2025-05-31",
  comparisonStart: "2025-04-01",
  comparisonEnd: "2025-04-30",
}
const user = { id: "user-a", role: "ADMIN", canAccessIndicators: true, mustChangePassword: false }

function fixture(options = {}) {
  const writes = []
  const queries = []
  const db = {
    indicatorAnalysis: {
      count: async ({ where }) => (where.status ? 0 : options.limit ? 20 : 0),
      create: async ({ data }) => {
        writes.push(data)
        return { id: "analysis-a", ...data }
      },
      update: async ({ data }) => {
        writes.push(data)
        return { id: "analysis-a", ...data }
      },
      findFirst: async (args) => {
        queries.push(args)
        return null
      },
      findMany: async (args) => {
        queries.push(args)
        return []
      },
    },
    $queryRaw: async () => [],
    $transaction: async (fn) => fn(db),
  }
  const route = load("app/api/indicadores/analysis/route.ts", {
    "@/lib/auth": {
      getCurrentUser: async () => (options.user === undefined ? user : options.user),
      isAdminRole: (role) => ["ADMIN", "ADMIN_MASTER"].includes(role),
    },
    "@/lib/prisma": { prisma: db },
    "@/lib/saipos/analysis-input": { analysisInput },
    "@/lib/saipos/analysis-context": {
      buildAnalysisContext: async () => {
        if (options.noData) throw new Error("NO_DATA")
        return { current: { summary: { orders: 12 } } }
      },
    },
  })
  return { ...route, writes, queries }
}
function request(body = valid, origin = "http://localhost:3000", query = "") {
  const { NextRequest } = requireDependency("next/server")
  return new NextRequest(`http://localhost:3000/api/indicadores/analysis${query}`, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

test("validates dates, store, question, closed periods and maximum range", () => {
  assert.equal(analysisInput.safeParse(valid).success, true)
  for (const patch of [
    { start: "2025-02-30" },
    { end: "2025-04-01" },
    { start: "2020-01-01" },
    { end: "2099-01-01" },
    { store: "-1" },
    { question: "  " },
    { question: "a".repeat(2001) },
    { unexpected: true },
  ]) {
    assert.equal(analysisInput.safeParse({ ...valid, ...patch }).success, false, JSON.stringify(patch))
  }
})

test("snapshot uses dashboard calculations, includes comparison-only stores and excludes raw customer data", async () => {
  const metrics = load("lib/saipos/dashboard-metrics.ts", {
    "@/lib/saipos/formatters": load("lib/saipos/formatters.ts"),
    "@/lib/saipos/period": load("lib/saipos/period.ts"),
  })
  const sale = (idStore, amount, canceled, date) => ({
    idStore,
    totalAmountInCents: amount,
    totalDiscountInCents: 0,
    totalIncreaseInCents: 0,
    canceled,
    createdAtSaipos: new Date(`${date}T12:00:00Z`),
    shiftDate: new Date(`${date}T00:00:00Z`),
    syncedAt: new Date("2025-06-01T12:00:00Z"),
    raw: { customer: { email: "private@example.test" } },
  })
  const calls = []
  const { buildAnalysisContext } = load("lib/saipos/analysis-context.ts", {
    "server-only": {},
    "@/lib/prisma": { prisma: { saiposSyncRun: { findFirst: async () => null } } },
    "./dashboard-metrics": metrics,
    "./dashboard-queries": {
      getSaiposStoreOptionsSource: async () => ({ storeIds: [{ idStore: 1 }, { idStore: 2 }], storeNameRows: [] }),
      getSaiposProductReferences: async () => [],
      getSaiposDashboardSales: async (input) => {
        calls.push(input)
        return input.period.start === valid.start
          ? [sale(1, 20000, false, valid.start), sale(1, 5000, true, valid.start)]
          : [sale(2, 10000, false, valid.comparisonStart)]
      },
      getSaiposDashboardItems: async () => [],
      getSaiposStockCmv: async () => ({ movementCount: 0, estimatedCostInCents: 0 }),
    },
  })
  const snapshot = await buildAnalysisContext(valid)
  assert.equal(snapshot.current.summary.netInCents, 20000)
  assert.equal(snapshot.current.summary.orders, 1)
  assert.equal(snapshot.current.summary.canceledOrdersTotal, 1)
  assert.equal(snapshot.changes.netRevenue, 1)
  assert.equal(snapshot.comparison.stores[0].id, 2)
  assert.equal(snapshot.current.cmv, null)
  assert.equal(snapshot.current.daily[0].date, valid.start)
  assert.equal(snapshot.current.daily[0].netInCents, 20000)
  assert.ok(calls.every((call) => call.selectedStore === "all"))
  assert.doesNotMatch(JSON.stringify(snapshot), /private@example|customer|"raw"/)
  await assert.rejects(() => buildAnalysisContext({ ...valid, store: "999" }), /UNKNOWN_STORE/)
})

test("API boundaries and provider persistence", async (t) => {
  const originalKey = process.env.ANTHROPIC_API_KEY
  const originalFetch = global.fetch
  process.env.ANTHROPIC_API_KEY = "test-key-never-sent"
  let providerCalls = 0
  global.fetch = async (_url, options) => {
    providerCalls++
    const payload = JSON.parse(options.body)
    assert.equal(options.headers["x-api-key"], "test-key-never-sent")
    assert.equal(payload.max_tokens, 3000)
    assert.match(payload.messages[0].content, /orders/)
    return Response.json({
      content: [{ type: "text", text: "Análise de teste" }],
      usage: { input_tokens: 30, output_tokens: 10 },
      stop_reason: "end_turn",
    })
  }
  try {
    await t.test("denies unauthenticated and unauthorized users", async () => {
      for (const denied of [
        null,
        { ...user, role: "USER" },
        { ...user, canAccessIndicators: false },
        { ...user, mustChangePassword: true },
      ]) {
        const route = fixture({ user: denied })
        assert.equal((await route.POST(request())).status, 401)
        assert.equal((await route.GET(request())).status, 401)
      }
    })
    await t.test("rejects cross-origin writes", async () =>
      assert.equal((await fixture().POST(request(valid, "https://other.example"))).status, 403)
    )
    await t.test("validates input before writes", async () => {
      const route = fixture()
      assert.equal((await route.POST(request({ ...valid, store: "bad" }))).status, 400)
      assert.equal(route.writes.length, 0)
    })
    await t.test("disables generation without key", async () => {
      delete process.env.ANTHROPIC_API_KEY
      assert.equal((await fixture().POST(request())).status, 503)
      process.env.ANTHROPIC_API_KEY = "test-key-never-sent"
    })
    await t.test("scopes history and detail to owner", async () => {
      const route = fixture()
      await route.GET(request())
      assert.deepEqual(route.queries[0].where, { userId: "user-a" })
      assert.equal((await route.GET(request(valid, "http://localhost:3000", "?id=other-user-analysis"))).status, 404)
      assert.deepEqual(route.queries[1].where, { id: "other-user-analysis", userId: "user-a" })
    })
    await t.test("enforces quota before calling Claude", async () => {
      assert.equal((await fixture({ limit: true }).POST(request())).status, 429)
      assert.equal(providerCalls, 0)
    })
    await t.test("does not send empty datasets", async () => {
      const route = fixture({ noData: true })
      assert.equal((await route.POST(request())).status, 422)
      assert.equal(route.writes.at(-1).status, "failed")
      assert.equal(providerCalls, 0)
    })
    await t.test("saves snapshot, answer and usage", async () => {
      const route = fixture()
      assert.equal((await route.POST(request())).status, 200)
      assert.equal(route.writes[0].userId, user.id)
      assert.equal(route.writes[1].snapshot.current.summary.orders, 12)
      assert.equal(route.writes[2].answer, "Análise de teste")
      assert.equal(route.writes[2].status, "completed")
      assert.equal(route.writes[2].inputTokens, 30)
    })
    await t.test("provider failure is saved without exposing upstream secrets", async () => {
      global.fetch = async () => new Response("secret upstream error", { status: 500 })
      const route = fixture()
      const response = await route.POST(request())
      assert.equal(response.status, 503)
      assert.equal(route.writes.at(-1).status, "failed")
      assert.doesNotMatch(await response.text(), /secret upstream/)
    })
  } finally {
    global.fetch = originalFetch
    if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY
    else process.env.ANTHROPIC_API_KEY = originalKey
  }
})
