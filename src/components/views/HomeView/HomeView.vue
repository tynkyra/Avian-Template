<script setup lang="ts">
import { ref, watch } from "vue";
import useStore from "@src/store/store";
import { useRoute } from "vue-router";

import FadeTransition from "@src/components/ui/transitions/FadeTransition.vue";
import Navigation from "@src/components/views/HomeView/Navigation/Navigation.vue";
import Sidebar from "@src/components/views/HomeView/Sidebar/Sidebar.vue";

const store = useStore();
const route = useRoute();

// Sidebar visibility state for mobile
const isSidebarOpen = ref(false);

// Auto-close sidebar when navigating to a chat on mobile
watch(() => route.params.id, (newId) => {
  if (newId) {
    isSidebarOpen.value = false;
  }
});

// Toggle sidebar on mobile
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

// Provide toggle function to child components
import { provide } from "vue";
provide('toggleSidebar', toggleSidebar);
</script>

<template>
  <KeepAlive>
    <div
      class="xs:relative md:static h-full flex xs:flex-col md:flex-row overflow-hidden"
    >
      <!--navigation-bar-->
      <Navigation 
        class="xs:order-last xs:fixed xs:bottom-0 xs:left-0 xs:right-0 md:order-first md:static xs:z-30 md:z-auto" 
        @toggle-sidebar="toggleSidebar"
      />

      <!--sidebar overlay for mobile-->
      <div
        v-if="isSidebarOpen"
        @click="isSidebarOpen = false"
        class="fixed xs:top-0 xs:bottom-16 md:inset-0 left-0 right-0 bg-white dark:bg-gray-900 z-10 xs:block md:hidden"
      ></div>
      
      <!--sidebar-->
      <Sidebar
        :class="[
          'xs:fixed xs:top-0 xs:left-0 xs:bottom-16 xs:z-20 md:static md:z-auto',
          'xs:transition-transform xs:duration-300 md:transition-none',
          'xs:grow-0 md:grow-0 xs:overflow-y-scroll md:overflow-visible scrollbar-hidden',
          isSidebarOpen ? 'xs:translate-x-0' : 'xs:-translate-x-full md:translate-x-0'
        ]"
      />
      
      <!--chat-->
      <div
        id="mainContent"
        :class="[
          'grow h-full xs:w-full md:w-fit scrollbar-hidden bg-white dark:bg-gray-800',
          isSidebarOpen ? 'xs:hidden md:block' : 'xs:block'
        ]"
        role="region"
      >
        <router-view v-slot="{ Component }">
          <FadeTransition name="fade" mode="out-in">
            <component :is="Component" :key="route.params.id" />
          </FadeTransition>
        </router-view>
      </div>
    </div>
  </KeepAlive>
</template>
