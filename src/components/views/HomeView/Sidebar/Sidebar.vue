<script setup lang="ts">
import { computed } from "vue";

import useStore from "@src/store/store";

import FadeTransition from "@src/components/ui/transitions/FadeTransition.vue";
import Calls from "@src/components/views/HomeView/Sidebar/Calls/Calls.vue";
import Conversations from "@src/components/views/HomeView/Sidebar/Conversations/Conversations.vue";
// Notifications import removed (notifications feature removed)
import Settings from "@src/components/views/HomeView/Sidebar/Settings/Settings.vue";

const store = useStore();

// Always show messages (Conversations) in the sidebar
const ActiveComponent = computed(() => Conversations);
</script>

<template>
  <aside
    class="xs:w-full md:w-72.5 h-full xs:px-5 md:p-0 flex flex-col overflow-visible transition-all duration-500"
  >
    <FadeTransition>
      <component :is="ActiveComponent" class="h-full flex flex-col" />
    </FadeTransition>
  </aside>
</template>
