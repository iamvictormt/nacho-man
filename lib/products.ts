import { productDetails } from "./product-details"

export interface Product {
  slug: string
  name: string
  description: string
  price: number
  priceUnit: "KG" | "UND"
  category: "CONGELADO" | "SECO"
  subcategory: string
  weight: string
  image: string
  tag: string | null
  tagColor: string
}

export type CatalogProduct = Product & {
  displayName: string
  subtitle?: string
  priceLabel: string
  features: string[]
  applications: string[]
}

export const allProducts: Product[] = [
  {
    slug: "carne-bovina-desfiada-artesanal",
    name: "Carne Bovina Desfiada Artesanal",
    description:
      "Carne bovina cozida lentamente, desfiada e temperada para garantir maciez, sabor e versatilidade em diversas preparações.",
    price: 61.9,
    priceUnit: "KG",
    category: "CONGELADO",
    subcategory: "Carnes",
    weight: "Caixa com 12 kg",
    image: "/product-images/carne barbacoa.webp",
    tag: null,
    tagColor: "",
  },
  {
    slug: "chili-de-carne-com-feijao",
    name: "Chili de Carne com Feijão",
    description:
      "Receita tex-mex com carne bovina moída, feijão e temperos selecionados.",
    price: 34.9,
    priceUnit: "KG",
    category: "CONGELADO",
    subcategory: "Carnes",
    weight: "Caixa com 12 kg",
    image: "/product-images/carne chili beans.webp",
    tag: null,
    tagColor: "",
  },
  {
    slug: "carne-suina-desfiada-com-barbecue",
    name: "Carne Suína Desfiada com Barbecue",
    description:
      "Carne suína cozida, desfiada e temperada com barbecue, com sabor marcante e textura macia.",
    price: 39.9,
    priceUnit: "KG",
    category: "CONGELADO",
    subcategory: "Carnes",
    weight: "Caixa com 12 kg",
    image: "/product-images/carne costelinha.webp",
    tag: null,
    tagColor: "",
  },
  {
    slug: "proteina-vegetal-temperada",
    name: "Proteína Vegetal Temperada",
    description:
      "Proteína vegetal texturizada cuidadosamente temperada, ideal para diversas aplicações culinárias.",
    price: 19.9,
    priceUnit: "KG",
    category: "CONGELADO",
    subcategory: "Vegetariano",
    weight: "Caixa com 12 kg",
    image: "/product-images/chili veg.webp",
    tag: "VEG",
    tagColor: "bg-green-600 text-white",
  },
  {
    slug: "frango-desfiado-ao-molho-especial",
    name: "Frango Desfiado ao Molho Especial",
    description:
      "Frango cozido e desfiado, envolvido em molho saboroso e levemente condimentado.",
    price: 42.9,
    priceUnit: "KG",
    category: "CONGELADO",
    subcategory: "Carnes",
    weight: "Caixa com 12 kg",
    image: "/carne-embalada.webp",
    tag: null,
    tagColor: "",
  },
  {
    slug: "feijao-cremoso-temperado",
    name: "Feijão Cremoso Temperado",
    description:
      "Feijão carioca preparado até atingir textura cremosa e sabor equilibrado.",
    price: 14.9,
    priceUnit: "KG",
    category: "CONGELADO",
    subcategory: "Acompanhamentos",
    weight: "Caixa com 12 kg",
    image: "/product-images/frijoles refritos.webp",
    tag: null,
    tagColor: "",
  },
  {
    slug: "frango-empanado-picante",
    name: "Frango Empanado Picante",
    description:
      "Frango empanado com tempero levemente picante, congelado e pronto para preparo.",
    price: 43.9,
    priceUnit: "KG",
    category: "CONGELADO",
    subcategory: "Carnes",
    weight: "Caixa com 6 kg",
    image: "/product-images/frango hot.webp",
    tag: "HOT",
    tagColor: "bg-red-600 text-white",
  },
  {
    slug: "churros-tradicional",
    name: "Churros Tradicional",
    description:
      "Massa tradicional de churros, congelada e pronta para fritura.",
    price: 14.9,
    priceUnit: "KG",
    category: "CONGELADO",
    subcategory: "Doces",
    weight: "Caixa com 8 kg",
    image: "/product-images/churros palito.webp",
    tag: null,
    tagColor: "",
  },
  {
    slug: "mini-churros-tradicional",
    name: "Mini Churros Tradicional",
    description:
      "Massa tradicional de churros, congelada, com 10 cm. Pronta para fritar e rechear.",
    price: 14.9,
    priceUnit: "KG",
    category: "CONGELADO",
    subcategory: "Doces",
    weight: "Caixa com 6 kg",
    image: "/product-images/mini churros.webp",
    tag: null,
    tagColor: "",
  },
  {
    slug: "chamoy-artesanal",
    name: "Chamoy Artesanal",
    description:
      "Geleia de frutas com toque picante. Ideal para preparo de drinks e sobremesas.",
    price: 15.9,
    priceUnit: "UND",
    category: "SECO",
    subcategory: "Molhos",
    weight: "Pacote 500 g | Caixa com 7 unidades",
    image: "/product-images/geleia chamoy.webp",
    tag: "NOVIDADE",
    tagColor: "bg-purple-medium text-white",
  },
  {
    slug: "base-para-maionese-de-bacon",
    name: "Base para Maionese de Bacon",
    description:
      "Preparado concentrado sabor bacon. Um kit rende até 2L de maionese pronta.",
    price: 29.9,
    priceUnit: "UND",
    category: "SECO",
    subcategory: "Kits",
    weight: "Caixa com 6 kits",
    image: "/product-images/kit bacon mayo.webp",
    tag: "RENDE 2L",
    tagColor: "bg-purple-medium text-white",
  },
  {
    slug: "base-para-maionese-de-chipotle",
    name: "Base para Maionese de Chipotle",
    description:
      "Preparado concentrado para elaboração de maionese de chipotle. Um kit rende até 2L de maionese pronta.",
    price: 23.9,
    priceUnit: "UND",
    category: "SECO",
    subcategory: "Kits",
    weight: "Caixa com 6 kits",
    image: "/embalagens-3.webp",
    tag: "RENDE 2L",
    tagColor: "bg-purple-medium text-white",
  },
  {
    slug: "hot-pickles-1l",
    name: "Hot Pickles 1L",
    description:
      "Versão food service do molho à base de picles e pimenta jalapeño, com sabor agridoce e toque picante.",
    price: 24.9,
    priceUnit: "UND",
    category: "SECO",
    subcategory: "Food Service",
    weight: "Caixa com 6 unidades",
    image: "/product-images/salsa hot pickles.webp",
    tag: "FOOD SERVICE",
    tagColor: "bg-lime text-background",
  },
  {
    slug: "jalapeno-2l",
    name: "Jalapeño 2L",
    description:
      "Versão food service do molho de pimenta jalapeño e alho com sabor marcante.",
    price: 79.9,
    priceUnit: "UND",
    category: "SECO",
    subcategory: "Food Service",
    weight: "Caixa com 4 unidades",
    image: "/product-images/salsa jalapeno.webp",
    tag: "FOOD SERVICE",
    tagColor: "bg-lime text-background",
  },
  {
    slug: "sweet-chili-2l",
    name: "Sweet Chili 2L",
    description:
      "Versão food service do molho agridoce de pimenta, levemente picante.",
    price: 41.9,
    priceUnit: "UND",
    category: "SECO",
    subcategory: "Food Service",
    weight: "Caixa com 4 unidades",
    image: "/product-images/sweet chili.webp",
    tag: "FOOD SERVICE",
    tagColor: "bg-lime text-background",
  },
  {
    slug: "roja-1l",
    name: "Roja 1L",
    description:
      "Molho de pimenta jalapeño vermelho, inspirado na culinária mexicana, estilo Sriracha.",
    price: 29.9,
    priceUnit: "UND",
    category: "SECO",
    subcategory: "Food Service",
    weight: "Caixa com 6 unidades",
    image: "/product-images/salsa roja.webp",
    tag: "FOOD SERVICE",
    tagColor: "bg-lime text-background",
  },
  {
    slug: "ghost-pepper-200ml",
    name: "Ghost Pepper 200 ml",
    description:
      "Molho de pimenta extremamente picante, elaborado com Bhut Jolokia para quem busca intensidade e personalidade.",
    price: 15.9,
    priceUnit: "UND",
    category: "SECO",
    subcategory: "Molhos",
    weight: "Caixa com 9 unidades",
    image: "/product-images/salsa ghost pepper.webp",
    tag: "EXTREME",
    tagColor: "bg-red-600 text-white",
  },
  {
    slug: "hot-pickles-200ml",
    name: "Hot Pickles 200 ml",
    description:
      "Molho à base de picles e pimenta jalapeño, com sabor agridoce e toque picante.",
    price: 13.9,
    priceUnit: "UND",
    category: "SECO",
    subcategory: "Molhos",
    weight: "Caixa com 9 unidades",
    image: "/product-images/salsa hot pickles.webp",
    tag: null,
    tagColor: "",
  },
  {
    slug: "jalapeno-200ml",
    name: "Jalapeño 200 ml",
    description: "Molho de pimenta jalapeño e alho com sabor marcante.",
    price: 13.9,
    priceUnit: "UND",
    category: "SECO",
    subcategory: "Molhos",
    weight: "Unidade 200 ml",
    image: "/product-images/salsa jalapeno.webp",
    tag: null,
    tagColor: "",
  },
  {
    slug: "pina-habanero-200ml",
    name: "Piña Habanero 200 ml",
    description:
      "Molho que combina o sabor tropical de abacaxi com pimenta habanero.",
    price: 9.9,
    priceUnit: "UND",
    category: "SECO",
    subcategory: "Molhos",
    weight: "Caixa com 9 unidades",
    image: "/product-images/salsa pina habanero.webp",
    tag: null,
    tagColor: "",
  },
  {
    slug: "salsa-negra-200ml",
    name: "Salsa Negra 200 ml",
    description:
      "Molho de pimenta habanero chocolate com sabor intenso.",
    price: 13.9,
    priceUnit: "UND",
    category: "SECO",
    subcategory: "Molhos",
    weight: "Caixa com 9 unidades",
    image: "/product-images/salsa negra.webp",
    tag: null,
    tagColor: "",
  },
  {
    slug: "sweet-chili-200ml",
    name: "Sweet Chili 200 ml",
    description:
      "Molho agridoce de pimenta, levemente picante.",
    price: 8.9,
    priceUnit: "UND",
    category: "SECO",
    subcategory: "Molhos",
    weight: "Caixa com 9 unidades",
    image: "/product-images/sweet chili.webp",
    tag: null,
    tagColor: "",
  },
  {
    slug: "acucar-especial-para-churros",
    name: "Açúcar Especial para Churros",
    description:
      "Combinação de açúcar e especiarias para finalização de churros e outras sobremesas.",
    price: 8.9,
    priceUnit: "UND",
    category: "SECO",
    subcategory: "Temperos",
    weight: "Pacote com 500 g",
    image: "/product-images/açucar churros.webp",
    tag: null,
    tagColor: "",
  },
  {
    slug: "tempero-especial-para-batatas",
    name: "Tempero Especial para Batatas",
    description:
      "Combinação de temperos desenvolvida para realçar o sabor de batatas e porções.",
    price: 14.9,
    priceUnit: "UND",
    category: "SECO",
    subcategory: "Temperos",
    weight: "Pacote com 500 g",
    image: "/product-images/sal batata.webp",
    tag: null,
    tagColor: "",
  },
  {
    slug: "tempero-especial-para-snacks",
    name: "Tempero Especial para Snacks",
    description:
      "Combinação de temperos desenvolvida para agregar sabor e personalidade a chips, snacks e petiscos.",
    price: 7.9,
    priceUnit: "UND",
    category: "SECO",
    subcategory: "Temperos",
    weight: "Pacote com 500 g",
    image: "/product-images/sal para chips.webp",
    tag: null,
    tagColor: "",
  },
  {
    slug: "base-temperada-para-arroz",
    name: "Base Temperada para Arroz",
    description:
      "Base concentrada para preparo de um arroz rápido e saboroso. Rende 900 g de arroz pronto.",
    price: 5.9,
    priceUnit: "UND",
    category: "SECO",
    subcategory: "Acompanhamentos",
    weight: "Caixa com 15 pacotes de 100 g",
    image: "/product-images/base arroz.webp",
    tag: "RENDE 900G",
    tagColor: "bg-purple-medium text-white",
  },
  {
    slug: "tempero-mexicano-tajin",
    name: "Tempero Mexicano Tajín",
    description:
      "Tempero mexicano cítrico com sal e pimentas, levemente picante.",
    price: 35.9,
    priceUnit: "UND",
    category: "SECO",
    subcategory: "Temperos",
    weight: "Pacote com 250 g",
    image: "/molhos.webp",
    tag: "IMPORTADO",
    tagColor: "bg-lime text-background",
  },
]

export function getProductBySlug(slug: string): CatalogProduct | undefined {
  return catalogProducts.find((p) => p.slug === slug)
}

export function getProductsByCategory(category: string): Product[] {
  return allProducts.filter(
    (p) => p.category === category || p.subcategory === category
  )
}

export function getCategories(): string[] {
  return [...new Set(allProducts.map((p) => p.subcategory))]
}

const productDetailsBySlug = new Map(
  productDetails.map((product) => [product.slug, product])
)

export const catalogProducts: CatalogProduct[] = allProducts.map((product) => {
  const detail = productDetailsBySlug.get(product.slug)

  return {
    ...product,
    displayName: detail?.name ?? product.name,
    subtitle: detail?.subtitle,
    priceLabel:
      detail?.price ?? `${formatCatalogPrice(product.price)} / ${product.priceUnit}`,
    features: detail?.features ?? [product.description],
    applications: detail?.applications ?? [],
  }
})

export const catalogProductsBySlug = new Map(
  catalogProducts.map((product) => [product.slug, product])
)

function formatCatalogPrice(price: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price)
}

export function getRelatedProducts<T extends Product>(
  current: T,
  allProductsList: T[],
  max: number = 4
): T[] {
  const sameSubcategory = allProductsList.filter(
    (p) => p.slug !== current.slug && p.subcategory === current.subcategory
  )

  if (sameSubcategory.length >= max) {
    return sameSubcategory.slice(0, max)
  }

  const sameCategory = allProductsList.filter(
    (p) =>
      p.slug !== current.slug &&
      p.category === current.category &&
      p.subcategory !== current.subcategory
  )

  return [...sameSubcategory, ...sameCategory].slice(0, max)
}
