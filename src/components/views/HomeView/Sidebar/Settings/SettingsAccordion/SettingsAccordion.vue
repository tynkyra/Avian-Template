<script setup lang="ts">
import { ref } from "vue";

import AccountSettings from "@src/components/views/HomeView/Sidebar/Settings/SettingsAccordion/AccountSettings.vue";
// PrivacySettings import removed (privacy feature removed)
import AppearanceSettings from "@src/components/views/HomeView/Sidebar/Settings/SettingsAccordion/AppearanceSettings.vue";
// NotificationsSettings import removed (notifications feature removed)

// Types
enum accordionItems {
  accountSettings = "account-settings",
  appearanceSettings = "appearance-settings",
  // notificationsSettings and privacySettings removed
}

const accordionState = ref({
  "account-settings": true,
  "appearance-settings": true,
  // "notifications-settings" removed (notifications feature removed)
});

// Listen for a custom event to open the account tab
if (typeof window !== 'undefined') {
  window.addEventListener('open-account-settings', () => {
    accordionState.value['account-settings'] = false;
    accordionState.value['appearance-settings'] = true;
  });
}

const handleToggle = (name: accordionItems) => {
  // close all opened tabs
  for (let key of Object.keys(accordionState.value)) {
    if (key !== name) {
      accordionState.value[<accordionItems>key] = true;
    }
  }
  // open the clicked tabs
  accordionState.value[name] = !accordionState.value[name];
};
</script>

<template>
  <!--settings accordion-->
  <div
    role="list"
    aria-label="Settings Accordion Control Group Buttons"
    class="h-full"
  >
    <AccountSettings
      :collapsed="accordionState['account-settings']"
      :handleToggle="() => handleToggle(accordionItems.accountSettings)"
    />
    <AppearanceSettings
      :collapsed="accordionState['appearance-settings']"
      :handleToggle="() => handleToggle(accordionItems.appearanceSettings)"
    />
    <!-- NotificationsSettings removed (notifications feature removed) -->
  </div>
</template>
