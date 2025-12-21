<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide } from "vue";

import useStore from "@src/store/store";

import FadeTransition from "@src/components/ui/transitions/FadeTransition.vue";

// Toast state
const toast = ref<{ message: string; type: 'success' | 'error'; visible: boolean } | null>(null);
let toastTimeout: number | null = null;

function showToast(message: string, type: 'success' | 'error' = 'success') {
  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }
  toast.value = { message, type, visible: true };
  toastTimeout = window.setTimeout(() => {
    toast.value = null;
    toastTimeout = null;
  }, 1500);
}

provide('showToast', showToast);

// Refactoring code:
// todo reorganize component structure
// todo refactor remove getters from utils file and add them to store folder.
// todo improve the video component.
// todo add shortcuts

// future features:
// todo add video calling
// todo add stories

// Accessability:
// todo improve the way you view messages.
// todo make multi-select more accessible.
// todo make dropdown menus more accessible.
// todo make modals more accessible.
// todo make lists (i.e conversations, contacts, calls) more accessible.

// SEO.
// todo improve seo.

// Performance:
// todo add dynamic imports.
// todo add chunking.

const store = useStore();

// update localStorage with state changes
store.$subscribe((_mutation, state) => {
  localStorage.setItem("chat", JSON.stringify(state));
});

// here we load the data from the server.
onMounted(async () => {
  // Initialize authentication and load user data if logged in
  await store.initializeAuth();
  
  // Set delay loading to false after short delay for UI transitions
  setTimeout(() => {
    store.delayLoading = false;
  }, 100);
});

// the app height
const height = ref(`${window.innerHeight}px`);

// change the app height to the window hight.
const resizeWindow = () => {
  height.value = `${window.innerHeight}px`;
};

// and add the resize event when the component mounts.
onMounted(() => {
  window.addEventListener("resize", resizeWindow);
});

// remove the event when un-mounting the component.
onUnmounted(() => {
  window.removeEventListener("resize", resizeWindow);
});
</script>

<template>
  <div :class="{ dark: store.settings.darkMode }">
    <div
      class="bg-white dark:bg-gray-800 transition-colors duration-500"
      :style="{ height: height }"
    >
      <!-- Global Toast Notification -->
      <transition name="fade">
        <div
          v-if="toast && toast.visible"
          class="fixed top-6 left-1/2 z-50 px-6 py-3 rounded shadow-lg text-center"
          :class="[
            'transform -translate-x-1/2',
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white',
            // no font-semibold, keep font-normal
            'text-base',
            'max-w-xs',
            store.settings.darkMode ? 'bg-opacity-90' : 'bg-opacity-95'
          ]"
          style="min-width: 200px; max-width: 90vw;"
        >
          {{ toast.message }}
        </div>
      </transition>
      <router-view v-slot="{ Component }">
        <FadeTransition>
          <component :is="Component" />
        </FadeTransition>
      </router-view>
    </div>
  </div>
</template>
