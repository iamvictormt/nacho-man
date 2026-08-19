import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { DEFAULT_STORE_WHATSAPP_NUMBER } from "@/lib/whatsapp"

export const SITE_SETTINGS_CACHE_TAG = "site-settings"
const SITE_SETTINGS_CACHE_SECONDS = 300

export const storeWhatsAppSetting = {
  key: "store.whatsapp.number",
  label: "WhatsApp comercial",
  fallback: DEFAULT_STORE_WHATSAPP_NUMBER,
} as const

export const paymentDiscountSettings = {
  pix: {
    key: "payment.discount.pix",
    franchiseeOnlyKey: "payment.discount.pix.franchiseeOnly",
    label: "Desconto PIX (%)",
    fallback: "4",
  },
  card: {
    key: "payment.discount.card",
    franchiseeOnlyKey: "payment.discount.card.franchiseeOnly",
    label: "Desconto cartão (%)",
    fallback: "0",
  },
  boleto: {
    key: "payment.discount.boleto",
    franchiseeOnlyKey: "payment.discount.boleto.franchiseeOnly",
    label: "Desconto boleto (%)",
    fallback: "0",
  },
} as const

export const orderMessageSettings = {
  whatsapp: {
    key: "order.message.whatsapp",
    label: "Mensagem padrão do WhatsApp",
    fallback:
      "Olá! Quero finalizar o pedido {pedido}.\n\n{cliente}\n\n{itens}\n\nSubtotal: {subtotal}\n{descontos}\nTotal estimado: {total}\n\nPagamento: {pagamento}\nEntrega: {entrega}\n{observacoes}",
  },
  emailSubject: {
    key: "order.email.subject",
    label: "Título do e-mail de pedido",
    fallback: "Pedido {pedido} confirmado - Nacho Factory",
  },
  emailMessage: {
    key: "order.email.message",
    label: "Mensagem do e-mail de pedido",
    fallback:
      "Olá, {cliente}. Recebemos o pedido {pedido} de {empresa}. A equipe Nacho Factory vai seguir com o atendimento e atualizar o status pelo marketplace.",
  },
} as const

function parsePercentage(value: string | undefined, fallback: string) {
  const parsed = Number(String(value ?? fallback).replace(",", "."))
  if (!Number.isFinite(parsed)) return Number(fallback)
  return Math.min(100, Math.max(0, parsed))
}

function parseBoolean(value: string | undefined) {
  return value === "true"
}

export const loginImageSettings = [
  {
    key: "login.image.login",
    mode: "login",
    label: "Login",
    fallback: "/embalagens-3.webp",
    eyebrow: "Acesso ao marketplace",
    title: "Entre para comprar com a Nacho Man.",
    description: "Acesse sua conta para consultar produtos, montar pedidos e falar com a Nacho Factory.",
  },
  {
    key: "login.image.register",
    mode: "register",
    label: "Cadastrar",
    fallback: "/local-nacho-factory.webp",
    eyebrow: "Novo cadastro",
    title: "Cliente ou franqueado, seu acesso começa aqui.",
    description:
      "Crie uma conta comum para comprar ou solicite aprovação como franqueado informando os dados da unidade.",
  },
  {
    key: "login.image.forgot",
    mode: "forgot",
    label: "Esqueci minha senha",
    fallback: "/camara-fria.webp",
    eyebrow: "Recuperar senha",
    title: "Receba um código e volte para sua conta.",
    description: "Enviamos um código alfanumérico de 4 caracteres para confirmar sua identidade e trocar a senha.",
  },
] as const

export type LoginImageMode = (typeof loginImageSettings)[number]["mode"]

export type LoginSideContent = Record<
  LoginImageMode,
  {
    image: string
    eyebrow: string
    title: string
    description: string
  }
>

function getFallbackLoginSideContent(): LoginSideContent {
  return Object.fromEntries(
    loginImageSettings.map((item) => [
      item.mode,
      {
        image: item.fallback,
        eyebrow: item.eyebrow,
        title: item.title,
        description: item.description,
      },
    ])
  ) as LoginSideContent
}

function getFallbackPaymentDiscountSettings() {
  return {
    pixDiscountPercent: parsePercentage(undefined, paymentDiscountSettings.pix.fallback),
    cardDiscountPercent: parsePercentage(undefined, paymentDiscountSettings.card.fallback),
    boletoDiscountPercent: parsePercentage(undefined, paymentDiscountSettings.boleto.fallback),
    pixFranchiseeOnly: false,
    cardFranchiseeOnly: false,
    boletoFranchiseeOnly: false,
  }
}

function getFallbackOrderMessageSettings() {
  return {
    whatsappTemplate: orderMessageSettings.whatsapp.fallback,
    emailSubjectTemplate: orderMessageSettings.emailSubject.fallback,
    emailMessageTemplate: orderMessageSettings.emailMessage.fallback,
  }
}

export const getLoginSideContent = unstable_cache(
  async (): Promise<LoginSideContent> => {
    try {
      const settings = await prisma.siteSetting.findMany({
        where: { key: { in: loginImageSettings.map((item) => item.key) } },
      })
      const values = new Map(settings.map((setting) => [setting.key, setting.value]))

      return Object.fromEntries(
        loginImageSettings.map((item) => [
          item.mode,
          {
            image: values.get(item.key) || item.fallback,
            eyebrow: item.eyebrow,
            title: item.title,
            description: item.description,
          },
        ])
      ) as LoginSideContent
    } catch (error) {
      console.warn("Using fallback login side content because site settings could not be loaded.", error)
      return getFallbackLoginSideContent()
    }
  },
  ["login-side-content"],
  { revalidate: SITE_SETTINGS_CACHE_SECONDS, tags: [SITE_SETTINGS_CACHE_TAG] }
)

export const getStoreWhatsAppNumber = unstable_cache(
  async () => {
    try {
      const setting = await prisma.siteSetting.findUnique({ where: { key: storeWhatsAppSetting.key } })
      return setting?.value || storeWhatsAppSetting.fallback
    } catch (error) {
      console.warn("Using fallback WhatsApp number because site settings could not be loaded.", error)
      return storeWhatsAppSetting.fallback
    }
  },
  ["store-whatsapp-number"],
  { revalidate: SITE_SETTINGS_CACHE_SECONDS, tags: [SITE_SETTINGS_CACHE_TAG] }
)

export const getPaymentDiscountSettings = unstable_cache(
  async () => {
    try {
      const discountKeys = Object.values(paymentDiscountSettings).flatMap((setting) => [
        setting.key,
        setting.franchiseeOnlyKey,
      ])
      const settings = await prisma.siteSetting.findMany({
        where: {
          key: {
            in: discountKeys,
          },
        },
      })
      const values = new Map(settings.map((setting) => [setting.key, setting.value]))

      return {
        pixDiscountPercent: parsePercentage(
          values.get(paymentDiscountSettings.pix.key),
          paymentDiscountSettings.pix.fallback
        ),
        cardDiscountPercent: parsePercentage(
          values.get(paymentDiscountSettings.card.key),
          paymentDiscountSettings.card.fallback
        ),
        boletoDiscountPercent: parsePercentage(
          values.get(paymentDiscountSettings.boleto.key),
          paymentDiscountSettings.boleto.fallback
        ),
        pixFranchiseeOnly: parseBoolean(values.get(paymentDiscountSettings.pix.franchiseeOnlyKey)),
        cardFranchiseeOnly: parseBoolean(values.get(paymentDiscountSettings.card.franchiseeOnlyKey)),
        boletoFranchiseeOnly: parseBoolean(values.get(paymentDiscountSettings.boleto.franchiseeOnlyKey)),
      }
    } catch (error) {
      console.warn("Using fallback payment discount settings because site settings could not be loaded.", error)
      return getFallbackPaymentDiscountSettings()
    }
  },
  ["payment-discount-settings"],
  { revalidate: SITE_SETTINGS_CACHE_SECONDS, tags: [SITE_SETTINGS_CACHE_TAG] }
)

export const getOrderMessageSettings = unstable_cache(
  async () => {
    try {
      const settings = await prisma.siteSetting.findMany({
        where: {
          key: {
            in: [
              orderMessageSettings.whatsapp.key,
              orderMessageSettings.emailSubject.key,
              orderMessageSettings.emailMessage.key,
            ],
          },
        },
      })
      const values = new Map(settings.map((setting) => [setting.key, setting.value]))

      return {
        whatsappTemplate: values.get(orderMessageSettings.whatsapp.key) || orderMessageSettings.whatsapp.fallback,
        emailSubjectTemplate:
          values.get(orderMessageSettings.emailSubject.key) || orderMessageSettings.emailSubject.fallback,
        emailMessageTemplate:
          values.get(orderMessageSettings.emailMessage.key) || orderMessageSettings.emailMessage.fallback,
      }
    } catch (error) {
      console.warn("Using fallback order message settings because site settings could not be loaded.", error)
      return getFallbackOrderMessageSettings()
    }
  },
  ["order-message-settings"],
  { revalidate: SITE_SETTINGS_CACHE_SECONDS, tags: [SITE_SETTINGS_CACHE_TAG] }
)
