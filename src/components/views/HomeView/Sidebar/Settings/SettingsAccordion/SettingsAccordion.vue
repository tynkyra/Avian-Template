<script setup lang="ts">
import { ref } from "vue";

import AccountSettings from "@src/components/views/HomeView/Sidebar/Settings/SettingsAccordion/AccountSettings.vue";
import PrivacySettings from "@src/components/views/HomeView/Sidebar/Settings/SettingsAccordion/PrivacySettings.vue";
import AppearanceSettings from "@src/components/views/HomeView/Sidebar/Settings/SettingsAccordion/AppearanceSettings.vue";
// NotificationsSettings import removed (notifications feature removed)

// Types
enum accordionItems {
  accountSettings = "account-settings",
  privacySettings = "privacy-settings",
  appearanceSettings = "appearance-settings",
  // notificationsSettings removed (notifications feature removed)
}

const accordionState = ref({
  "account-settings": true,
  "privacy-settings": true,
  "appearance-settings": true,
  // "notifications-settings" removed (notifications feature removed)
});

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
    <PrivacySettings
      :collapsed="accordionState['privacy-settings']"
      :handleToggle="() => handleToggle(accordionItems.privacySettings)"
    />
    <AppearanceSettings
      :collapsed="accordionState['appearance-settings']"
      :handleToggle="() => handleToggle(accordionItems.appearanceSettings)"
    />
    <!-- NotificationsSettings removed (notifications feature removed) -->
  </div>
</template>
