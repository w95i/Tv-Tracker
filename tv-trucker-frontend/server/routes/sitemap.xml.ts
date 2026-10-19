// sitemap.xml: the landing page in English (/) and Arabic (/ar), each listing the other as its hreflang
// alternate, with / as the x-default.
export default defineEventHandler((event) => {
  const site = useRuntimeConfig(event).public.siteUrl;
  const pages = [
    { loc: `${site}/`, lang: "en" },
    { loc: `${site}/ar`, lang: "ar" },
  ];
  const alternates = [
    ...pages.map((p) => `    <xhtml:link rel="alternate" hreflang="${p.lang}" href="${p.loc}"/>`),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${site}/"/>`,
  ].join("\n");
  const today = new Date().toISOString().slice(0, 10);
  const urls = pages
    .map((p) => `  <url>\n    <loc>${p.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n${alternates}\n  </url>`)
    .join("\n");
  setHeader(event, "content-type", "application/xml; charset=utf-8");
  setHeader(event, "cache-control", "public, max-age=86400");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
});
