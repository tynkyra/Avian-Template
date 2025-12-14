<script setup lang="ts">
import { onMounted, watch } from "vue";
import type { IConversation } from "@src/types";
import Conversation from "./Conversation.vue";
import useStore from "@src/store/store";

const props = defineProps<{
  conversations: IConversation[];
}>();

const store = useStore();

onMounted(async () => {
  // Load conversations from backend when component mounts
  console.log('ConversationsList - onMounted: loading conversations...');
  await store.loadConversations();
  console.log('ConversationsList - Conversations loaded:', store.conversations.length);
});

// Watch props to see what's being passed
watch(() => props.conversations, (newVal) => {
  console.log('ConversationsList - Received props.conversations:', newVal);
  console.log('ConversationsList - Count:', newVal?.length);
}, { immediate: true });
</script>

<template>
  <div>
    <p v-if="!props.conversations || props.conversations.length === 0" class="px-5 py-4 text-gray-500">
      DEBUG: No conversations to display (count: {{ props.conversations?.length || 0 }})
    </p>
    <Conversation
      v-for="conversation in props.conversations"
      :conversation="conversation"
      :key="conversation.id"
      role="listitem"
    />
  </div>
</template>
