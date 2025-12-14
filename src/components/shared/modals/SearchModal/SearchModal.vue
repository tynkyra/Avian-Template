<script setup lang="ts">
import type { IConversation, IMessage } from "@src/types";

import { ref, computed } from "vue";

import NoMessage from "@src/components/states/empty-states/NoMessage.vue";
import IconButton from "@src/components/ui/inputs/IconButton.vue";
import SearchInput from "@src/components/ui/inputs/SearchInput.vue";
import Modal from "@src/components/ui/utils/Modal.vue";
import MessageItem from "@src/components/shared/modals/SearchModal/MessageItem.vue";
import ScrollBox from "@src/components/ui/utils/ScrollBox.vue";
import { XMarkIcon } from "@heroicons/vue/24/outline";

const props = defineProps<{
  open: boolean;
  closeModal: () => void;
  conversation: IConversation;
}>();

const searchQuery = ref("");

// Filter messages based on search query
const filteredMessages = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.conversation?.messages || [];
  }
  
  const query = searchQuery.value.toLowerCase();
  return (props.conversation?.messages || []).filter((message: IMessage) => {
    // Search in message content (handle both string and IRecording types)
    const content = typeof message.content === 'string' ? message.content : '';
    return content.toLowerCase().includes(query);
  });
});

// Handle clicking on a message - scroll to it in chat
const handleMessageClick = (messageId: number) => {
  // Close the modal first
  props.closeModal();
  
  // Scroll to the message after a brief delay to ensure chat is visible
  setTimeout(() => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the message briefly
      messageElement.classList.add('bg-blue-100', 'dark:bg-blue-900');
      setTimeout(() => {
        messageElement.classList.remove('bg-blue-100', 'dark:bg-blue-900');
      }, 2000);
    }
  }, 100);
};
</script>

<template>
  <Modal :open="props.open" :close-modal="props.closeModal">
    <template v-slot:content>
      <div class="w-full max-w-3xl py-6 bg-white dark:bg-gray-800 rounded">
        <!--header-->
        <div class="mb-6 px-5 flex justify-between items-center">
          <p
            id="modal-title"
            class="heading-1 text-black/70 dark:text-white/70"
            tabindex="0"
          >
            Messages
          </p>

          <IconButton
            @click="props.closeModal"
            class="ic-btn-ghost-primary w-8 h-8"
            aria-label="Close modal"
            title="Close"
          >
            <XMarkIcon class="w-5 h-5" />
          </IconButton>
        </div>

        <!--search-->
        <div class="mx-5 mb-5">
          <SearchInput 
            :value="searchQuery" 
            @value-changed="(value) => searchQuery = value"
          />
        </div>

        <!--message-->
        <ScrollBox class="max-h-[32rem] overflow-y-scroll">
          <MessageItem
            v-if="filteredMessages.length > 0"
            v-for="message in filteredMessages"
            :message="message"
            :key="message.id"
            :search-query="searchQuery"
            @click="handleMessageClick(message.id)"
          />

          <div v-else-if="searchQuery && filteredMessages.length === 0" class="flex flex-col items-center justify-center py-10">
            <p class="body-2 text-black/70 dark:text-white/70 text-center">No messages found</p>
            <p class="body-4 text-black/50 dark:text-white/50 text-center mt-2">Try a different search term</p>
          </div>

          <NoMessage vertical v-else />
        </ScrollBox>
      </div>
    </template>
  </Modal>
</template>
