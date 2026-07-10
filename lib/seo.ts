export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.nachofactory.com.br"

export const siteName = "Nacho Factory"

export const defaultSeoDescription =
  "Alimentos prontos para operações de food service: carnes congeladas, molhos, temperos e kits para restaurantes, hamburguerias, eventos e revendedores."

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString()
}
