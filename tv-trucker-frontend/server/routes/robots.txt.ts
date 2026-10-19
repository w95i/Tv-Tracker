// robots.txt: everything may be crawled except the internal API; points crawlers at the sitemap.
export default defineEventHandler((event) => {
  const site = useRuntimeConfig(event).public.siteUrl;
  setHeader(event, "content-type", "text/plain; charset=utf-8");
  setHeader(event, "cache-control", "public, max-age=86400");
  return ["User-agent: *", "Allow: /", "Disallow: /api/", "", `Sitemap: ${site}/sitemap.xml`, ""].join("\n");
});
