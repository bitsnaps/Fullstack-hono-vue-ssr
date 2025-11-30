// src/main.js
import { createSSRApp } from "vue";
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
} from "vue-router";
import App from "./App.vue";
import routes from "./router";
import "./assets/main.css";

export function createApp() {
  const app = createSSRApp(App);

  const router = createRouter({
    history: import.meta.env.SSR
      ? createMemoryHistory() // server side
      : createWebHistory(), // client side
    routes,
  });

  app.use(router);

  return { app, router };
}
