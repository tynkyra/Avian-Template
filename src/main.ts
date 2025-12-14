import router from "@src/router";
import "@src/style.css";
import { createPinia } from "pinia";
import { createApp } from "vue";
import vClickOutside from "click-outside-vue3";
import useStore from "@src/store/store";

import App from "@src/App.vue";

const pinia = createPinia();
const app = createApp(App);

app.use(pinia).use(router).use(vClickOutside);

// Initialize authentication on app start
const store = useStore();
store.initializeAuth();

app.mount("#app");
