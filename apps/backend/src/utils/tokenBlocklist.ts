/**
 * Blocklist in-memory de tokens JWT invalidados.
 *
 * Tokens são adicionados aqui no logout e verificados no middleware de auth.
 * Como os tokens expiram em 24h, o crescimento do Set é naturalmente limitado.
 *
 * Trade-off: a blocklist é perdida ao reiniciar o servidor (tokens ficam válidos
 * novamente), mas isso só afeta sessões ativas no momento do restart.
 * Para HA/produção crítica, substituir por Redis.
 */

interface BlockedEntry {
  token: string
  expiresAt: number
}

const blocklist = new Set<string>()

// Cleanup periódico para não acumular tokens expirados na memória
const blocklistMeta = new Map<string, number>()

export const addToBlocklist = (token: string, expiresInMs: number = 24 * 60 * 60 * 1000): void => {
  blocklist.add(token)
  blocklistMeta.set(token, Date.now() + expiresInMs)
}

export const isBlocklisted = (token: string): boolean => {
  if (!blocklist.has(token)) return false

  const expiresAt = blocklistMeta.get(token)
  if (expiresAt && Date.now() > expiresAt) {
    // Token já expirou naturalmente — remove da blocklist
    blocklist.delete(token)
    blocklistMeta.delete(token)
    return false
  }

  return true
}
