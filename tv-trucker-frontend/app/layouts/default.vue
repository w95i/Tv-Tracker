<template>
  <div>
    <SiteSplash />
    <a class="skip" href="#main">{{ $t("skip") }}</a>
    <SiteHeader />
    <main id="main">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
