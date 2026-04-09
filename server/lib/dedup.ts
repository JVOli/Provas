export function normalizeRaceName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\d+[ªºa]?\s*(edicao|edicoes|edition)?\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[m][n]
}

export function isDuplicate(
  a: { name: string; date: Date; state: string },
  b: { name: string; date: Date; state: string }
): boolean {
  if (a.state !== b.state) return false

  const diffMs = Math.abs(a.date.getTime() - b.date.getTime())
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  if (diffDays > 1) return false

  const normA = normalizeRaceName(a.name)
  const normB = normalizeRaceName(b.name)

  if (normA === normB) return true
  if (levenshtein(normA, normB) < 4) return true

  return false
}
