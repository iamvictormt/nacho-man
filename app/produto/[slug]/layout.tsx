import type { Metadata } from "next"
import { catalogProductsBySlug } from "@/lib/products"
import { absoluteUrl } from "@/lib/seo"

type ProductLayoutProps = {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: ProductLayoutProps): Promise<Metadata> {
  const { slug } = await params
  const product = catalogProductsBySlug.get(slug)

  if (!product) {
    return {
      title: "Produto não encontrado",
      robots: {
        index: false,
        follow: false,
      },
    }
  }

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
