<script setup lang="ts">
import { computed } from "vue";

import useStore from "@src/lib/store/store";

import FadeTransition from "@src/components/ui/transitions/FadeTransition.vue";
import Calls from "@src/components/sidebar/calls/Calls.vue";
import Contacts from "@src/components/sidebar/contacts/Contacts.vue";
import Conversations from "@src/components/sidebar/conversations/Conversations.vue";
import Notifications from "@src/components/sidebar/notifications/Notifications.vue";
import Settings from "@src/components/sidebar/settings/Settings.vue";

const store = useStore();

// the selected sidebar component (e.g message/notifications/settings)
const ActiveComponent = computed((): any => {
  if (store.activeSidebarComponent === "messages") {
    return Conversations;
  } else if (store.activeSidebarComponent === "contacts") {
    return Contacts;
  } else if (store.activeSidebarComponent === "notifications") {
    return Notifications;
  } else if (store.activeSidebarComponent === "phone") {
    return Calls;
  } else if (store.activeSidebarComponent === "settings") {
    return Settings;
  }
});
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
