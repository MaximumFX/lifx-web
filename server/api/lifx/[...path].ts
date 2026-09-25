// Proxies requests to the LIFX API using the token from the httpOnly cookie,
// so the token never has to be exposed to client-side JavaScript.
const ALLOWED = /^(lights|scenes)(\/|$)/

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path') ?? ''
  if (!ALLOWED.test(path)) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const token = getToken(event)
  const method = event.method
  const body = method === 'GET' || method === 'HEAD' ? undefined : await readBody(event)
  return lifxFetch(token, path, { method, body })
})
