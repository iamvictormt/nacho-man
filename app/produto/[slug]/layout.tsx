import type { Metadata } from "next"
import type { ReactNode } from "react"
import { adaptMarketplaceProduct } from "@/lib/marketplace-product-adapter"
import { prisma } from "@/lib/prisma"
import { absoluteUrl } from "@/lib/seo"
import type { Prisma } from "@prisma/client"

export const dynamic = "force-dynamic"

const productMetadataSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  features: true,
  applications: true,
  storageInfo: true,
  usageInfo: true,
  yieldInfo: true,
  image: true,
  priceInCents: true,
  unit: true,
  packageLabel: true,
  minimumQuantity: true,
  category: { select: { name: true } },
} satisfies Prisma.ProductSelect

type ProductLayoutProps = {
  children: ReactNode
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductLayoutProps): Promise<Metadata> {
  const { slug } = await params
  const productRecord = await prisma.product.findFirst({
    where: { slug, audience: "PUBLIC", active: true, category: { active: true } },
    select: productMetadataSelect,
  })

  if (!productRecord) {
    return {
      title: "Produto não encontrado",
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const product = adaptMarketplaceProduct(productRecord)
  const description = `${product.displayName}: ${product.features.slice(0, 2).join(". ")}. Aplicações: ${product.applications.slice(0, 4).join(", ")}.`

  return {
    title: product.displayName,
    description,
    alternates: {
      canonical: `/produto/${product.slug}`,
    },
    openGraph: {
      title: `${product.displayName} | Nacho Factory`,
      description,
      url: `/produto/${product.slug}`,
      images: [
        {
          url: absoluteUrl(product.image),
          width: 1200,
          height: 630,
          alt: product.displayName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.displayName} | Nacho Factory`,
      description,
      images: [absoluteUrl(product.image)],
    },
  }
}

export default function ProdutoLayout({ children }: ProductLayoutProps) {
  return children
}
