// Lets a link force a language or theme: /#ar, /#en, /#light, /#dark.
export default defineNuxtPlugin((nuxtApp) => {
  const q = location.hash.match(/^#(ar|en|light|dark)$/)?.[1] as "ar" | "en" | "light" | "dark" | undefined;
  if (!q) return;
  if (q === "light" || q === "dark") useTheme().setTheme(q);
  else nuxtApp.hook("app:mounted", () => nuxtApp.$i18n.setLocale(q));
});
