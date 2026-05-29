export interface Product {
  slug: string
  name: string
  description: string
  price: number
  category: "CONGELADO" | "SECO"
  subcategory: string
  weight: string
  image: string
  tag: string | null
  tagColor: string
}

export const allProducts: Product[] = [
  // CONGELADOS
  {
    slug: "carne-barbacoa-1-5kg",
    name: "Carne Barbacoa 1,5kg",
    description: "Carne desfiada temperada lentamente no estilo mexicano.",
    price: 71.0,
    category: "CONGELADO",
    subcategory: "Carnes",
    weight: "1,5kg",
    image: "/carne.webp",
    tag: "BEST SELLER",
    tagColor: "bg-lime text-background",
  },
  {
    slug: "carne-chili-beans-1-5kg",
    name: "Carne Chili Beans 1,5kg",
    description: "Mistura de carne com feijão e temperos mexicanos.",
    price: 49.0,
    category: "CONGELADO",
    subcategory: "Carnes",
    weight: "1,5kg",
    image: "/carne.webp",
    tag: null,
    tagColor: "",
  },
  {
    slug: "carne-costelinha-1-5kg",
    name: "Carne Costelinha 1,5kg",
    description: "Costelinha suína desfiada e extremamente suculenta.",
    price: 57.0,
    category: "CONGELADO",
    subcategory: "Carnes",
    weight: "1,5kg",
    image: "/costelinha.webp",
    tag: "NOVO",
    tagColor: "bg-purple-medium text-white",
  },
  {
    slug: "chili-veg-1kg",
    name: "Chili Veg 1kg",
    description:
      "Versão vegetariana do tradicional chili mexicano. Com proteína de soja, milho, temperos. Levemente apimentado.",
    price: 22.0,
    category: "CONGELADO",
    subcategory: "Vegetariano",
    weight: "1kg",
    image: "/embalagens.webp",
    tag: "VEG",
    tagColor: "bg-green-600 text-white",
  },
  {
    slug: "frango-desfiado-ao-molho-1-5kg",
    name: "Frango Desfiado ao Molho 1,5kg",
    description:
      "Frango desfiado extremamente macio e temperado ao molho de tomate e mostarda.",
    price: 59.0,
    category: "CONGELADO",
    subcategory: "Carnes",
    weight: "1,5kg",
    image: "/carne-embalada.webp",
    tag: null,
    tagColor: "",
  },
  {
    slug: "frijoles-refritos-1kg",
    name: "Frijoles Refritos 1kg",
    description: "Feijão refrito mexicano cremoso e pronto para uso.",
    price: 16.8,
    category: "CONGELADO",
    subcategory: "Acompanhamentos",
    weight: "1kg",
    image: "/produtos-congelados.webp",
    tag: null,
    tagColor: "",
  },
  {
    slug: "base-arroz-mexicano-100g",
    name: "Base Arroz Mexicano 100g",
    description:
      "Base concentrada para preparo rápido do arroz mexicano. Rende 900gr de Arroz Pronto.",
    price: 4.6,
    category: "CONGELADO",
    subcategory: "Acompanhamentos",
    weight: "100g",
    image: "/produtos-congelados.webp",
    tag: "RENDE 900G",
    tagColor: "bg-purple-medium text-white",
  },
  {
    slug: "frango-empanado-hot-10un",
    name: "Frango Empanado Hot c/10 unidades",
    description: "Frango empanado crocante e picante.",
    price: 44.0,
    category: "CONGELADO",
    subcategory: "Carnes",
    weight: "10 unidades",
    image: "/produtos-congelados.webp",
    tag: "🔥 HOT",
    tagColor: "bg-red-600 text-white",
  },
  {
    slug: "churros-palito-1kg",
    name: "Churros Palito 1kg",
    description: "Churros em formato palito para fritura rápida.",
    price: 14.4,
    category: "CONGELADO",
    subcategory: "Doces",
    weight: "1kg",
    image: "/embalagens-2.webp",
    tag: null,
    tagColor: "",
  },
  {
    slug: "mini-churros-sem-recheio-1kg",
    name: "Mini Churros sem Recheio 1kg",
    description: "Mini churros de 10cm, congelados. Só fritar e rechear.",
    price: 14.4,
    category: "CONGELADO",
    subcategory: "Doces",
    weight: "1kg",
    image: "/embalagens-3.webp",
    tag: null,
    tagColor: "",
  },
  // SECOS - MOLHOS
  {
    slug: "salsa-jalapeno-200ml",
    name: "Salsa Jalapeño 200ml",
    description:
      "Molho jalapeño com sabor intenso e levemente defumado. Ideal para tacos, nachos, burritos, hambúrgueres e porções.",
    price: 14.0,
    category: "SECO",
    subcategory: "Molhos",
    weight: "200ml",
    image: "/molhos.webp",
    tag: null,
    tagColor: "",
  },
  {
    slug: "salsa-jalapeno-2l",
    name: "Salsa Jalapeño 2L",
    description:
      "Versão econômica para operações food service. Excelente rendimento para restaurantes e cozinhas industriais.",
    price: 74.9,
    category: "SECO",
    subcategory: "Food Service",
    weight: "2L",
    image: "/molhos.webp",
    tag: "FOOD SERVICE",
    tagColor: "bg-lime text-background",
  },
  {
    slug: "salsa-ghost-pepper-200ml",
    name: "Salsa Ghost Pepper 200ml",
    description:
      "Molho extremamente picante produzido com pimenta Ghost Pepper.",
    price: 16.5,
    category: "SECO",
    subcategory: "Molhos",
    weight: "200ml",
    image: "/molhos.webp",
    tag: "🔥 EXTREME",
    tagColor: "bg-red-600 text-white",
  },
  {
    slug: "salsa-hot-pickles-200ml",
    name: "Salsa Hot Pickles 200ml",
    description: "Molho agridoce e picante com sabor marcante de picles.",
    price: 14.0,
    category: "SECO",
    subcategory: "Molhos",
    weight: "200ml",
    image: "/molhos.webp",
    tag: null,
    tagColor: "",
  },
  {
    slug: "salsa-hot-pickles-1l",
    name: "Salsa Hot Pickles 1L",
    description: "Versão food service da Salsa Hot Pickles.",
    price: 34.8,
    category: "SECO",
    subcategory: "Food Service",
    weight: "1L",
    image: "/molhos.webp",
    tag: "FOOD SERVICE",
    tagColor: "bg-lime text-background",
  },
  {
    slug: "salsa-negra-200ml",
    name: "Salsa Negra 200ml",
    description: "Molho escuro com perfil defumado e sabor intenso.",
    price: 14.0,
    category: "SECO",
    subcategory: "Molhos",
    weight: "200ml",
    image: "/molhos.webp",
    tag: null,
    tagColor: "",
  },
  {
    slug: "salsa-habanero-pina-200ml",
    name: "Salsa Habanero Piña 200ml",
    description: "Combinação tropical de abacaxi com pimenta habanero.",
    price: 12.0,
    category: "SECO",
    subcategory: "Molhos",
    weight: "200ml",
    image: "/molhos.webp",
    tag: null,
    tagColor: "",
  },
  {
    slug: "salsa-roja-1l",
    name: "Salsa Roja 1L",
    description: "Molho vermelho tradicional mexicano.",
    price: 32.0,
    category: "SECO",
    subcategory: "Food Service",
    weight: "1L",
    image: "/molhos.webp",
    tag: null,
    tagColor: "",
  },
  {
    slug: "salsa-sweet-chili-200ml",
    name: "Salsa Sweet Chili 200ml",
    description: "Molho agridoce levemente picante.",
    price: 12.0,
    category: "SECO",
    subcategory: "Molhos",
    weight: "200ml",
    image: "/molhos.webp",
    tag: null,
    tagColor: "",
  },
  {
    slug: "salsa-sweet-chili-2l",
    name: "Salsa Sweet Chili 2L",
    description: "Versão profissional para food service.",
    price: 39.5,
    category: "SECO",
    subcategory: "Food Service",
    weight: "2L",
    image: "/molhos.webp",
    tag: "FOOD SERVICE",
    tagColor: "bg-lime text-background",
  },
  {
    slug: "salsa-verde-300ml",
    name: "Salsa Verde 300ml",
    description: "Molho verde mexicano refrescante e levemente ácido.",
    price: 14.9,
    category: "SECO",
    subcategory: "Molhos",
    weight: "300ml",
    image: "/molhos.webp",
    tag: null,
    tagColor: "",
  },
  {
    slug: "salsa-verde-600ml",
    name: "Salsa Verde 600ml",
    description: "Versão econômica para restaurantes e delivery.",
    price: 21.9,
    category: "SECO",
    subcategory: "Food Service",
    weight: "600ml",
    image: "/molhos.webp",
    tag: null,
    tagColor: "",
  },
  {
    slug: "kit-base-bacon-mayo",
    name: "Kit Base Bacon Mayo (1UN)",
    description:
      "Kit completo para produção da maionese de Bacon. Emulsifique em 1,8 litros de óleo de soja. Rendimento aproximado 2L de Maionese de Bacon.",
    price: 25.0,
    category: "SECO",
    subcategory: "Kits",
    weight: "1 unidade",
    image: "/embalagens.webp",
    tag: "RENDE 2L",
    tagColor: "bg-purple-medium text-white",
  },
  {
    slug: "kit-base-molho-chipotle",
    name: "Kit Base Molho Chipotle (1UN)",
    description:
      "Kit completo para produção da maionese chipotle. Emulsifique em 1,8 litros de óleo de soja. Rendimento aproximado 2L de Maionese de Chipotle.",
    price: 19.0,
    category: "SECO",
    subcategory: "Kits",
    weight: "1 unidade",
    image: "/embalagens-3.webp",
    tag: "RENDE 2L",
    tagColor: "bg-purple-medium text-white",
  },
  {
    slug: "chamoy-geleia-500g",
    name: "Chamoy (Geleia) 500g",
    description:
      "Molho mexicano agridoce com toque picante. Ideal para preparo de Drinks e Sobremesas.",
    price: 21.0,
    category: "SECO",
    subcategory: "Molhos",
    weight: "500g",
    image: "/molhos.webp",
    tag: "NOVIDADE",
    tagColor: "bg-purple-medium text-white",
  },
  {
    slug: "acucar-especial-churros-500g",
    name: "Açúcar Especial p/ Churros 500g",
    description: "Mistura especial pronta para finalização de churros.",
    price: 7.0,
    category: "SECO",
    subcategory: "Temperos",
    weight: "500g",
    image: "/embalagens-2.webp",
    tag: null,
    tagColor: "",
  },
  {
    slug: "sal-temperado-batata-500g",
    name: "Sal Especial Temperado p/ Batata 500g",
    description: "Tempero exclusivo para batatas fritas.",
    price: 12.0,
    category: "SECO",
    subcategory: "Temperos",
    weight: "500g",
    image: "/embalagens.webp",
    tag: null,
    tagColor: "",
  },
  {
    slug: "sal-temperado-chips-500g",
    name: "Sal Especial Temperado p/ Chips 500g",
    description: "Tempero especial para chips e snacks.",
    price: 6.0,
    category: "SECO",
    subcategory: "Temperos",
    weight: "500g",
    image: "/embalagens-3.webp",
    tag: null,
    tagColor: "",
  },
  {
    slug: "tajin-250g",
    name: "Tajín 250g",
    description: "Tempero mexicano cítrico e levemente picante.",
    price: 32.0,
    category: "SECO",
    subcategory: "Temperos",
    weight: "250g",
    image: "/molhos.webp",
    tag: "IMPORTADO",
    tagColor: "bg-lime text-background",
  },
]

export function getProductBySlug(slug: string): Product | undefined {
  return allProducts.find((p) => p.slug === slug)
}

export function getProductsByCategory(category: string): Product[] {
  return allProducts.filter(
    (p) => p.category === category || p.subcategory === category
  )
}

export function getCategories(): string[] {
  return [...new Set(allProducts.map((p) => p.subcategory))]
}

/**
 * Returns up to `max` related products from the same category/subcategory,
 * excluding the current product. Prioritizes same subcategory, then same category.
 */
export function getRelatedProducts(
  current: Product,
  allProductsList: Product[],
  max: number = 4
): Product[] {
  // First, get products from the same subcategory (excluding current)
  const sameSubcategory = allProductsList.filter(
    (p) => p.slug !== current.slug && p.subcategory === current.subcategory
  )

  if (sameSubcategory.length >= max) {
    return sameSubcategory.slice(0, max)
  }

  // Fill remaining slots with products from the same category (but different subcategory)
  const sameCategory = allProductsList.filter(
    (p) =>
      p.slug !== current.slug &&
      p.category === current.category &&
      p.subcategory !== current.subcategory
  )

  const combined = [...sameSubcategory, ...sameCategory]
  return combined.slice(0, max)
}
