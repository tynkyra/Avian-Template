// ...existing code...
<script setup lang="ts">
import type { Ref } from "vue";

import { ref } from "vue";

import useStore from "@src/store/store";

import AccordionButton from "@src/components/ui/data-display/AccordionButton.vue";
import Button from "@src/components/ui/inputs/Button.vue";
import DropFileUpload from "@src/components/ui/inputs/DropFileUpload.vue";
import LabeledTextInput from "@src/components/ui/inputs/LabeledTextInput.vue";
import Collapse from "@src/components/ui/utils/Collapse.vue";

// Types
interface AccountValues {
  firstName: string | undefined;
  lastName: string | undefined;
  avatar: File | undefined;
}

// Variables
const props = defineProps<{
  collapsed: boolean;
  handleToggle: () => void;
}>();

const store = useStore();


const accountValues: Ref<AccountValues> = ref({
  firstName: '',
  lastName: '',
  avatar: undefined,
});

import { watch, onMounted } from 'vue';

// Sync accountValues with store.user on mount and when user changes
const syncAccountValues = () => {
  accountValues.value.firstName = store.user?.firstName || '';
  accountValues.value.lastName = store.user?.lastName || '';
};
onMounted(syncAccountValues);
watch(() => store.user, syncAccountValues, { immediate: true, deep: true });

const loading = ref(false);

// (event) handle submitting the values of the form.
import { apiService } from '@src/services/api';

import { inject } from 'vue';
const showToast = inject('showToast') as (msg: string, type?: 'success' | 'error') => void;

const handleSubmit = async () => {
  loading.value = true;
  try {
    let avatarFile = accountValues.value.avatar;
    let formData = new FormData();
    formData.append('firstName', accountValues.value.firstName || '');
    formData.append('lastName', accountValues.value.lastName || '');
    if (avatarFile instanceof File) {
      formData.append('avatar', avatarFile);
    }

    // Use apiService.request for PUT /users/me (matches backend)
    const updatedUser = await apiService.request('/users/me', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`
      },
      body: formData
    });
    store.$patch({ user: updatedUser });
    showToast && showToast('Profile updated!', 'success');
    // Close dropdown on success
    props.handleToggle();
  } catch (e) {
    console.error(e);
    showToast && showToast('Failed to update profile', 'error');
    // Do NOT close dropdown on error
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <!--account settings-->
  <AccordionButton
    id="account-settings-toggler"
    class="w-full flex px-5 py-6 mb-3 rounded focus:outline-none"
    :collapsed="props.collapsed"
    chevron
    aria-controls="account-settings-collapse"
    @click="handleToggle()"
  >
    <p class="heading-2 text-black/70 dark:text-white/70 mb-4">Account</p>
    <p class="body-2 text-black/70 dark:text-white/70">
      Update your profile details
    </p>
  </AccordionButton>


  <Collapse id="account-settings-collapse" :collapsed="props.collapsed">


    <LabeledTextInput
      label="First name"
      class="mb-5"
      :value="accountValues?.firstName"
      @value-changed="(value) => (accountValues.firstName = value)"
    />
    <LabeledTextInput
      label="Last name"
      class="mb-5"
      :value="accountValues?.lastName"
      @value-changed="(value) => (accountValues.lastName = value)"
    />
    <DropFileUpload
      label="Avatar"
      class="mb-7"
      accept="image/*"
      :value="accountValues.avatar"
      @value-changed="(value) => (accountValues.avatar = value)"
    />
    <Button
      class="contained-primary contained-text w-full py-4 mb-4"
      @click="handleSubmit"
      :loading="loading"
    >
      Save Settings
    </Button>

      <!-- Password change section removed as requested -->
  </Collapse>

  <!-- Logout button removed as requested -->
</template>

