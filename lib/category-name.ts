const LOWERCASE_PARTICLES = new Set(["a", "as", "da", "das", "de", "do", "dos", "e", "em", "na", "nas", "no", "nos", "para", "por"])

export function normalizeCategoryName(value: string) {
  const words = value.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR").split(" ")

  return words
    .map((word, index) => {
      if (index > 0 && LOWERCASE_PARTICLES.has(word)) return word
      return word.replace(/[\p{L}\p{N}]/u, (character) => character.toLocaleUpperCase("pt-BR"))
    })
    .join(" ")
}
