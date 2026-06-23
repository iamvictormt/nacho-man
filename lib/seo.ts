export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nacho-man-test.vercel.app/"

export const siteName = "Nacho Factory"

export const defaultSeoDescription =
  "Alimentos prontos para operações de food service: carnes congeladas, molhos, temperos e kits para restaurantes, hamburguerias, eventos e revendedores."

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString()
}
