import { createApp } from "./main";
import { renderToString } from "@vue/server-renderer";

export async function render(url) {
  const { app, router } = createApp();

  await router.push(url);
  await router.isReady();

  const html = await renderToString(app);
  return html;
}
