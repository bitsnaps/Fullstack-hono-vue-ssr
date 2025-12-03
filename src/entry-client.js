import { createApp } from "./main";

const { app, router } = createApp();

router.isReady().then(() => {
  // `true` = hydrate existing SSR HTML instead of replacing it
  app.mount("#app", true);
});
