type ProductDetail = {
  slug: string
  name?: string
  subtitle?: string
  price?: string
  features: string[]
  applications: string[]
}

export const productDetails: ProductDetail[] = [
  {
    slug: "carne-bovina-desfiada-artesanal",
    features: ["Cozimento lento", "Carne bovina desfiada", "Temperada e pronta para finalizar", "Caixa com 12 kg"],
    applications: ["Tacos", "Burritos", "Nachos", "Bowls", "Sanduíches", "Pizzas"],
  },
  {
    slug: "chili-de-carne-com-feijao",
    features: ["Receita tex-mex", "Carne bovina moída com feijão", "Temperos selecionados", "Caixa com 12 kg"],
    applications: ["Nachos", "Burritos", "Tacos", "Batatas", "Bowls"],
  },
  {
    slug: "carne-suina-desfiada-com-barbecue",
    features: ["Carne suína desfiada", "Molho barbecue", "Textura macia", "Caixa com 12 kg"],
    applications: ["Sanduíches", "Hambúrgueres", "Tacos", "Nachos", "Porções"],
  },
  {
    slug: "proteina-vegetal-temperada",
    features: ["Proteína vegetal texturizada", "Temperada", "Versátil para cozinha profissional", "Caixa com 12 kg"],
    applications: ["Tacos", "Burritos", "Bowls", "Wraps", "Saladas"],
  },
  {
    slug: "frango-desfiado-ao-molho-especial",
    features: ["Frango cozido e desfiado", "Molho especial", "Levemente condimentado", "Caixa com 12 kg"],
    applications: ["Tacos", "Burritos", "Sanduíches", "Coxinhas", "Pastéis", "Recheios"],
  },
  {
    slug: "feijao-cremoso-temperado",
    features: ["Feijão carioca", "Textura cremosa", "Sabor equilibrado", "Caixa com 12 kg"],
    applications: ["Nachos", "Tacos", "Burritos", "Bowls", "Pratos mexicanos"],
  },
  {
    slug: "frango-empanado-picante",
    features: ["Empanado congelado", "Levemente picante", "Pronto para preparo", "Caixa com 6 kg"],
    applications: ["Porções", "Combos", "Lanches", "Delivery", "Burritos"],
  },
  {
    slug: "churros-tradicional",
    features: ["Massa tradicional", "Congelado", "Pronto para fritura", "Caixa com 8 kg"],
    applications: ["Sobremesas", "Eventos", "Food service", "Delivery"],
  },
  {
    slug: "mini-churros-tradicional",
    features: ["Massa tradicional", "Mini churros de 10 cm", "Pronto para fritar e rechear", "Caixa com 6 kg"],
    applications: ["Sobremesas", "Cafeterias", "Eventos", "Delivery"],
  },
  {
    slug: "chamoy-artesanal",
    features: ["Geleia de frutas", "Toque picante", "Pacote de 500 g", "Caixa com 7 unidades"],
    applications: ["Drinks", "Sobremesas", "Sorvetes", "Frutas"],
  },
  {
    slug: "base-para-maionese-de-bacon",
    features: ["Sabor bacon", "Rende até 2L", "Preparo concentrado", "Caixa com 6 kits"],
    applications: ["Hambúrgueres", "Batatas", "Sanduíches", "Porções"],
  },
  {
    slug: "base-para-maionese-de-chipotle",
    features: ["Sabor chipotle", "Rende até 2L", "Preparo concentrado", "Caixa com 6 kits"],
    applications: ["Hambúrgueres", "Tacos", "Sanduíches", "Batatas"],
  },
  {
    slug: "hot-pickles-1l",
    features: ["Food service", "Base de picles e jalapeño", "Agridoce e picante", "Caixa com 6 unidades"],
    applications: ["Hambúrgueres", "Hot dogs", "Batatas", "Sanduíches"],
  },
  {
    slug: "jalapeno-2l",
    features: ["Food service", "Pimenta jalapeño e alho", "Sabor marcante", "Caixa com 4 unidades"],
    applications: ["Tacos", "Nachos", "Hambúrgueres", "Porções"],
  },
  {
    slug: "sweet-chili-2l",
    features: ["Food service", "Agridoce", "Levemente picante", "Caixa com 4 unidades"],
    applications: ["Frango", "Batatas", "Porções", "Hambúrgueres"],
  },
  {
    slug: "roja-1l",
    features: ["Estilo Sriracha", "Jalapeño vermelho", "Inspirado na culinária mexicana", "Caixa com 6 unidades"],
    applications: ["Tacos", "Burritos", "Nachos", "Pratos mexicanos"],
  },
  {
    slug: "ghost-pepper-200ml",
    features: ["Extremamente picante", "Com Bhut Jolokia", "Sabor intenso", "Caixa com 9 unidades"],
    applications: ["Hambúrgueres", "Tacos", "Porções", "Desafios gastronômicos"],
  },
  {
    slug: "hot-pickles-200ml",
    features: ["Base de picles e jalapeño", "Agridoce", "Toque picante", "Caixa com 9 unidades"],
    applications: ["Hambúrgueres", "Hot dogs", "Batatas", "Sanduíches"],
  },
  {
    slug: "jalapeno-200ml",
    features: ["Pimenta jalapeño e alho", "Sabor marcante", "Pronto para uso", "Embalagem de 200 ml"],
    applications: ["Tacos", "Nachos", "Hambúrgueres", "Porções"],
  },
  {
    slug: "pina-habanero-200ml",
    features: ["Abacaxi com habanero", "Sabor tropical", "Picância equilibrada", "Caixa com 9 unidades"],
    applications: ["Tacos", "Peixes", "Frango", "Hambúrgueres"],
  },
  {
    slug: "salsa-negra-200ml",
    features: ["Habanero chocolate", "Sabor intenso", "Pronto para uso", "Caixa com 9 unidades"],
    applications: ["Carnes", "Hambúrgueres", "Tacos", "Costelas"],
  },
  {
    slug: "sweet-chili-200ml",
    features: ["Agridoce", "Levemente picante", "Pronto para uso", "Caixa com 9 unidades"],
    applications: ["Frango", "Batatas", "Porções", "Hambúrgueres"],
  },
  {
    slug: "acucar-especial-para-churros",
    features: ["Açúcar com especiarias", "Finalização pronta", "Pacote com 500 g", "Uso em sobremesas"],
    applications: ["Churros", "Sonhos", "Rosquinhas", "Sobremesas"],
  },
  {
    slug: "tempero-especial-para-batatas",
    features: ["Tempero para batatas", "Realça sabor", "Pacote com 500 g", "Pronto para uso"],
    applications: ["Batata frita", "Batata rústica", "Porções", "Snacks"],
  },
  {
    slug: "tempero-especial-para-snacks",
    features: ["Tempero para snacks", "Sabor marcante", "Pacote com 500 g", "Pronto para uso"],
    applications: ["Chips", "Snacks", "Petiscos", "Batatas"],
  },
  {
    slug: "base-temperada-para-arroz",
    features: ["Base concentrada", "Rende 900 g de arroz pronto", "Pacotes de 100 g", "Caixa com 15 pacotes"],
    applications: ["Bowls", "Pratos executivos", "Delivery", "Cozinha mexicana"],
  },
  {
    slug: "tempero-mexicano-tajin",
    features: ["Tempero mexicano cítrico", "Com sal e pimentas", "Levemente picante", "Pacote com 250 g"],
    applications: ["Frutas", "Drinks", "Batatas", "Milho", "Petiscos"],
  },
]
