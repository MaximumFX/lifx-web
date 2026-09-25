export default defineEventHandler((event) => {
  deleteCookie(event, TOKEN_COOKIE, { path: '/' })
  return { ok: true }
})
