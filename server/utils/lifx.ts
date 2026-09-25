import type { H3Event } from 'h3'
import { FetchError } from 'ofetch'

export const LIFX_API = 'https://api.lifx.com/v1'
export const TOKEN_COOKIE = 'lifx_token'

export function getToken(event: H3Event) {
  const token = getCookie(event, TOKEN_COOKIE)
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'No LIFX token' })
  }
  return token
}

/** Call the LIFX HTTP API, re-throwing upstream failures with their status code. */
export async function lifxFetch<T = unknown>(
  token: string,
  path: string,
  options: { method?: string, body?: unknown } = {}
): Promise<T> {
  try {
    return await $fetch<T>(`${LIFX_API}/${path}`, {
      method: (options.method ?? 'GET') as 'GET',
      body: options.body as Record<string, unknown> | undefined,
      headers: { Authorization: `Bearer ${token}` }
    })
  } catch (err) {
    if (err instanceof FetchError) {
      throw createError({
        statusCode: err.statusCode ?? 502,
        statusMessage: err.data?.error ?? err.statusMessage ?? 'LIFX API error',
        data: err.data
      })
    }
    throw err
  }
}
