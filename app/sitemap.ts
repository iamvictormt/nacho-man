import type { MetadataRoute } from "next"
import { catalogProducts } from "@/lib/products"
import { absoluteUrl } from "@/lib/seo"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticRoutes = ["/", "/produtos", "/sobre", "/contato"].map(
    (path) => ({
      url: absoluteUrl(path),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : 0.8,
    })
  )

  const productRoutes = catalogProducts.map((product) => ({
    url: absoluteUrl(`/produto/${product.slug}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  return [...staticRoutes, ...productRoutes]
}
