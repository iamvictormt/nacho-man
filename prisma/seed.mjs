import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

const categories = [
  {
    name: "Carnes",
    slug: "carnes",
    products: [
      {
        name: "Carne Bovina Desfiada Artesanal",
        slug: "carne-bovina-desfiada-artesanal",
        description: "Carne bovina cozida lentamente, desfiada e pronta para finalizar.",
        image: "/product-images/carne barbacoa.webp",
        priceInCents: 6190,
        unit: "KG",
        packageLabel: "Caixa com 12 kg",
      },
      {
        name: "Chili de Carne com Feijão",
        slug: "chili-de-carne-com-feijao",
        description: "Receita tex-mex com carne bovina, feijão e temperos selecionados.",
        image: "/product-images/carne chili beans.webp",
        priceInCents: 3490,
        unit: "KG",
        packageLabel: "Caixa com 12 kg",
      },
    ],
  },
  {
    name: "Molhos",
    slug: "molhos",
    products: [
      {
        name: "Jalapeño 2L",
        slug: "jalapeno-2l",
        description: "Molho de pimenta jalapeño e alho para food service.",
        image: "/product-images/salsa jalapeno.webp",
        priceInCents: 7990,
        unit: "UND",
        packageLabel: "Caixa com 4 unidades",
      },
      {
        name: "Sweet Chili 2L",
        slug: "sweet-chili-2l",
        description: "Molho agridoce de pimenta, levemente picante.",
        image: "/product-images/sweet chili.webp",
        priceInCents: 4190,
        unit: "UND",
        packageLabel: "Caixa com 4 unidades",
      },
    ],
  },
]

async function main() {
  const adminPassword = await hash("Trocar@123", 12)
  const franchisePassword = await hash("Trocar@123", 12)

  await prisma.user.upsert({
    where: { email: "admin@nachofactory.com.br" },
    update: {},
    create: {
      name: "Administrador Nacho Factory",
      email: "admin@nachofactory.com.br",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  })

  const franchise = await prisma.franchise.upsert({
    where: { document: "00000000000100" },
    update: {},
    create: {
      tradeName: "Nacho Man Unidade Demonstração",
      document: "00000000000100",
      whatsapp: "5547999999999",
    },
  })

  await prisma.user.upsert({
    where: { email: "franqueado@nachoman.com.br" },
    update: {},
    create: {
      name: "Franqueado Demonstração",
      email: "franqueado@nachoman.com.br",
      passwordHash: franchisePassword,
      role: "FRANCHISEE",
      franchiseId: franchise.id,
    },
  })

  for (const categoryData of categories) {
    const category = await prisma.category.upsert({
      where: { slug: categoryData.slug },
      update: { name: categoryData.name },
      create: { name: categoryData.name, slug: categoryData.slug },
    })

    for (const product of categoryData.products) {
      await prisma.product.upsert({
        where: { slug: product.slug },
        update: { ...product, categoryId: category.id },
        create: { ...product, categoryId: category.id },
      })
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
