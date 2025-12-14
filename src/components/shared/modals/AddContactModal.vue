<script setup lang="ts">
import { ref } from 'vue';
import useStore from '@src/store/store';
import { apiService } from '@src/services/api';
import Button from "@src/components/ui/inputs/Button.vue";
import LabeledTextInput from "@src/components/ui/inputs/LabeledTextInput.vue";
import Modal from "@src/components/ui/utils/Modal.vue";

const props = defineProps<{
  openModal: boolean;
  closeModal: () => void;
}>();

const store = useStore();
const email = ref('');
const isLoading = ref(false);
const error = ref('');

const handleAddContact = async () => {
  error.value = '';
  
  if (!email.value.trim()) {
    error.value = 'Please enter an email address';
    return;
  }

  isLoading.value = true;
  
  try {
    // Search for user by email
    const users = await apiService.searchUsers(email.value.trim());
    
    if (users.length === 0) {
      error.value = 'No user found with that email';
      return;
    }
    
    const user = users[0];
    
    // Check if already a contact
    if (store.user?.contacts?.some(c => c.id === user.id)) {
      error.value = 'This user is already in your contacts';
      return;
    }
    
    // Add contact
    await store.addContact(user.id);
    
    // Close modal and reset
    email.value = '';
    props.closeModal();
  } catch (err: any) {
    error.value = err.message || 'Failed to add contact';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <Modal :open="props.openModal" :closeModal="props.closeModal">
    <template v-slot:content>
      <div class="w-75 bg-white dark:bg-gray-800 rounded py-6">
        <!--modal header-->
        <div class="flex justify-between items-center px-5">
          <p
            id="modal-title"
            class="heading-1 text-black/70 dark:text-white/70"
            tabindex="0"
          >
            Add Contact
          </p>

          <Button
            class="outlined-danger ghost-text py-2 px-4"
            @click="props.closeModal"
          >
            esc
          </Button>
        </div>

        <!--text input-->
        <div class="px-5 pb-5 pt-6">
          <LabeledTextInput 
            type="email" 
            placeholder="Email" 
            v-model="email"
            @keyup.enter="handleAddContact"
          />
          <p v-if="error" class="text-red-500 text-sm mt-2">{{ error }}</p>
        </div>

        <!--submit button-->
        <div class="px-5">
          <Button 
            class="contained-primary contained-text w-full py-4"
            @click="handleAddContact"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Adding...' : 'Add' }}
          </Button>
        </div>
      </div>
    </template>
  </Modal>
</template>
