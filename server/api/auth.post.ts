export default defineEventHandler(async (event) => {
  const { token } = await readBody<{ token?: string }>(event)
  const trimmed = token?.trim()
  if (!trimmed) {
    throw createError({ statusCode: 400, statusMessage: 'Token is required' })
  }

  // Validate the token before storing it.
  await lifxFetch(trimmed, 'lights/all')

  setCookie(event, TOKEN_COOKIE, trimmed, {
    httpOnly: true,
    sameSite: 'lax',
    secure: !import.meta.dev,
    path: '/',
    maxAge: 60 * 60 * 24 * 365
  })
  return { ok: true }
})
