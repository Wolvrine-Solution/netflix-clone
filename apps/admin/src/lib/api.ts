const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000'

export async function adminFetch<T>(
  path: string,
  init?: RequestInit & { token?: string }
): Promise<T> {
  const { token, ...rest } = init ?? {}
  const res = await fetch(`${API_URL}/api/admin${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(rest.headers ?? {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error((err as { message?: string }).message ?? 'Request failed')
  }
  return res.json() as Promise<T>
}
