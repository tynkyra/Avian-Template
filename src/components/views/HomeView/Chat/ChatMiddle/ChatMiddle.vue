<script setup lang="ts">
import type { IConversation, IMessage } from "@src/types";
import type { Ref, ComputedRef } from "vue";

import { inject, onMounted, ref, watch, nextTick } from "vue";

import useStore from "@src/store/store";

import Message from "@src/components/views/HomeView/Chat/ChatMiddle/Message/Message.vue";
import TimelineDivider from "@src/components/views/HomeView/Chat/ChatMiddle/TimelineDivider.vue";

const props = defineProps<{
  handleSelectMessage: (messageId: number) => void;
  handleDeselectMessage: (messageId: number) => void;
  selectedMessages: number[];
}>();

const store = useStore();

const container: Ref<HTMLElement | null> = ref(null);

const activeConversation = inject("activeConversation") as ComputedRef<IConversation | undefined>;

// Debug: Watch activeConversation changes
watch(() => activeConversation.value, (newVal) => {
  console.log('[ChatMiddle.vue] activeConversation changed:', newVal?.name, 'Messages:', newVal?.messages?.length);
  console.log('[ChatMiddle.vue] store.status:', store.status);
  console.log('[ChatMiddle.vue] Condition check - status !== loading:', store.status !== 'loading');
  console.log('[ChatMiddle.vue] Condition check - has messages:', !!activeConversation.value?.messages);
  console.log('[ChatMiddle.vue] Full condition:', store.status !== 'loading' && !!activeConversation.value?.messages);
  if (newVal?.messages) {
    console.log('[ChatMiddle.vue] First 3 messages:', newVal.messages.slice(0, 3));
  }
}, { deep: true, immediate: true });

// checks whether the previous message was sent by the same user.
const isFollowUp = (index: number, previousIndex: number): boolean => {
  if (previousIndex < 0 || !activeConversation.value?.messages) {
    return false;
  } else {
    // For self-chat with avatarA/B, compare by avatar URL instead of sender ID
    const conversationAvatarA = (activeConversation.value as any)?.avatarA;
    const conversationAvatarB = (activeConversation.value as any)?.avatarB;
    
    if (conversationAvatarA && conversationAvatarB) {
      // Compare by avatar URL to distinguish between Avatar A and Avatar B
      let previousAvatar = activeConversation.value.messages[previousIndex]?.sender?.avatar;
      let currentAvatar = activeConversation.value.messages[index]?.sender?.avatar;
      return previousAvatar === currentAvatar;
    }
    
    // Default: compare by sender ID
    let previousSender = activeConversation.value.messages[previousIndex]?.sender?.id;
    let currentSender = activeConversation.value.messages[index]?.sender?.id;
    return previousSender === currentSender;
  }
};

// checks whether the message is sent by the authenticated user.
const isSelf = (message: IMessage): boolean => {
  // For self-chat, check if message was sent by Avatar A (right side)
  // Avatar A messages should be on the right, Avatar B on the left
  const conversationAvatarA = (activeConversation.value as any)?.avatarA;
  const conversationAvatarB = (activeConversation.value as any)?.avatarB;
  
  // If this conversation has avatarA/B set, determine side by avatar
  if (conversationAvatarA && conversationAvatarB) {
    return message.sender.avatar === conversationAvatarA;
  }
  
  // Otherwise, use the default logic
  return Boolean(store.user && message.sender.id === store.user.id);
};

// checks whether the new message has been sent in a new day or not.
const renderDivider = (index: number, previousIndex: number): boolean => {
  if (previousIndex < 0 || !activeConversation.value?.messages) {
    return index === 0; // Show divider for the first message
  }
  
  const currentMessage = activeConversation.value.messages[index];
  const previousMessage = activeConversation.value.messages[previousIndex];
  
  if (!currentMessage?.date || !previousMessage?.date) {
    return false;
  }
  
  // Parse dates (SQLite datetime format: YYYY-MM-DD HH:MM:SS)
  const currentDate = new Date(currentMessage.date).toDateString();
  const previousDate = new Date(previousMessage.date).toDateString();
  
  return currentDate !== previousDate;
};

// Get formatted date label for divider
const getDateLabel = (index: number): string => {
  if (!activeConversation.value?.messages?.[index]?.date) {
    return 'Today';
  }
  
  const messageDate = new Date(activeConversation.value.messages[index].date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Reset time part for comparison
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  messageDate.setHours(0, 0, 0, 0);
  
  if (messageDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (messageDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    // Format as "Month DD, YYYY"
    return messageDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }
};

// scroll to bottom function
const scrollToBottom = () => {
  nextTick(() => {
    if (container.value) {
      container.value.scrollTop = container.value.scrollHeight;
    }
  });
};

// scroll messages to bottom on mount.
onMounted(() => {
  scrollToBottom();
});

// watch for new messages and auto-scroll
watch(
  () => activeConversation.value?.messages?.length,
  (newLength, oldLength) => {
    if (newLength && oldLength && newLength > oldLength) {
      scrollToBottom();
    }
  }
);
</script>

<template>
  <div
    ref="container"
    class="grow px-5 py-5 flex flex-col overflow-y-scroll scrollbar-hidden"
  >
    <template v-if="store.status !== 'loading' && activeConversation?.messages">
      <div
        v-for="(message, index) in activeConversation.messages"
        :key="message.id"
      >
        <TimelineDivider 
          v-if="renderDivider(index, index - 1)" 
          :date-label="getDateLabel(index)"
        />

        <Message
          :message="message"
          :self="isSelf(message)"
          :follow-up="isFollowUp(index, index - 1)"
          :divider="renderDivider(index, index - 1)"
          :selected="props.selectedMessages.includes(message.id)"
          :handle-select-message="handleSelectMessage"
          :handle-deselect-message="handleDeselectMessage"
        />
      </div>
    </template>
  </div>
</template>
