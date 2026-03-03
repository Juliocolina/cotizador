import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  // A list of all locales that are supported
  locales: ["en", "es"],

  // If this locale is matched, pathnames work without a prefix (e.g. `/about`)
  defaultLocale: "es",
});

export const config = {
// Solo aplicar a las rutas que no sean archivos estáticos o API
  matcher: ['/', '/(es|en)/:path*']
};