export interface ApiResult<T> {
  data: T
}

export async function httpGet<T>(url: string): Promise<ApiResult<T>> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`GET failed: ${url}`)
  return { data: (await response.json()) as T }
}

export async function httpPost<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`POST failed: ${url}`)
  return { data: (await response.json()) as T }
}
