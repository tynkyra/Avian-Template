<script setup lang="ts">
import type { Ref } from "vue";

import useStore from "@src/store/store";
import { computed, provide, ref, watch, onMounted, nextTick } from "vue";
import { useRoute } from "vue-router";
import { apiService } from "@src/services/api";

import NoChatSelected from "@src/components/states/empty-states/NoChatSelected.vue";
import Spinner from "@src/components/states/loading-states/Spinner.vue";
import ChatBottom from "@src/components/views/HomeView/Chat/ChatBottom/ChatBottom.vue";
import ChatMiddle from "@src/components/views/HomeView/Chat/ChatMiddle/ChatMiddle.vue";
import ChatTop from "@src/components/views/HomeView/Chat/ChatTop/ChatTop.vue";

const store = useStore();
const route = useRoute();


onMounted(async () => {
  if (store.conversations.length === 0) {
    await store.loadConversations();
  }
});

// search the selected conversation using activeConversationId.
const activeConversation = computed(() => {
  const activeConversationId = route.params.id ? Number(route.params.id) : undefined;
  let activeConversation = store.conversations.find(
    (conversation) => conversation.id === activeConversationId,
  );
  if (activeConversation) {
    console.log('[Chat.vue computed] Found conversation:', activeConversation.name, 'messages:', activeConversation.messages?.length);
    return activeConversation;
  } else {
    const archived = store.archivedConversations.find(
      (conversation) => conversation.id === activeConversationId,
    );
    console.log('[Chat.vue computed] Found archived:', archived?.name, 'messages:', archived?.messages?.length);
    return archived;
  }
});

// provide the active conversation to all children.
provide("activeConversation", activeConversation);

// Debug template condition
const shouldShowChat = computed(() => {
  const hasRouteId = !!route.params.id;
  const hasConversation = !!activeConversation.value;
  console.log('[Chat.vue shouldShowChat]', {
    hasRouteId,
    hasConversation,
    routeId: route.params.id,
    conversationName: activeConversation.value?.name,
    messageCount: activeConversation.value?.messages?.length,
    storeStatus: store.status,
    delayLoading: store.delayLoading
  });
  return hasRouteId && hasConversation;
});


// Watch activeConversation and fetch messages/attachments when it changes
watch(
  activeConversation,
  async (conversation) => {
    console.log('[Chat.vue] Watcher triggered. Active conversation:', conversation);
    if (!conversation) return;
    try {
      const response = await apiService.getMessages(conversation.id);
      // Debug: print first and last message from API response
      if (response.messages && response.messages.length > 0) {
        console.log('[Chat.vue] First message from API:', response.messages[0]);
        console.log('[Chat.vue] Last message from API:', response.messages[response.messages.length - 1]);
      } else {
        console.log('[Chat.vue] No messages returned from API');
      }
      conversation.messages = response.messages;
      if (response.pinnedMessageIds && response.pinnedMessageIds.length > 0) {
        conversation.pinnedMessages = response.messages
          .filter(m => response.pinnedMessageIds.includes(m.id))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } else {
        conversation.pinnedMessages = [];
      }
    } catch (error) {
      console.error('[Chat.vue] Failed to load messages:', error);
    }
  },
  { immediate: true }
);

// determines whether select mode is enabled.
const selectMode = ref(false);

// determines whether all the messages are selected or not.
const selectAll = ref(false);

// holds the selected conversations.
const selectedMessages: Ref<number[]> = ref([]);

// (event) add message to select messages.
const handleSelectMessage = (messageId: number) => {
  selectedMessages.value.push(messageId);

  if (
    activeConversation.value &&
    selectedMessages.value.length === activeConversation.value.messages.length
  ) {
    selectAll.value = true;
  }

  if (!selectMode.value) {
    selectMode.value = true;
  }
};

// (event) remove message from select messages.
const handleDeselectMessage = (messageId: number) => {
  selectAll.value = false;
  selectedMessages.value = selectedMessages.value.filter(
    (item) => item !== messageId,
  );

  if (activeConversation.value && selectedMessages.value.length === 0) {
    selectMode.value = false;
  }
};

// (event) select all messages.
const handleSelectAll = () => {
  if (activeConversation.value) {
    const messages = activeConversation.value.messages.map(
      (message) => message.id,
    );
    selectedMessages.value = messages;
    selectAll.value = true;
  }
};

// (event) remove the selected messages.
const handleDeselectAll = () => {
  selectAll.value = false;
  selectedMessages.value = [];
};

// (event handle close Select)
const handleCloseSelect = () => {
  selectMode.value = false;
  selectAll.value = false;
  selectedMessages.value = [];
};
</script>

<template>
  <Spinner v-if="store.status === 'loading' || store.delayLoading" />

  <div
    v-else-if="route.params.id && activeConversation"
    class="h-full flex flex-col scrollbar-hidden"
  >
    <ChatTop
      :select-all="selectAll"
      :select-mode="selectMode"
      :handle-select-all="handleSelectAll"
      :handle-deselect-all="handleDeselectAll"
      :handle-close-select="handleCloseSelect"
    />
    <ChatMiddle
      :selected-messages="selectedMessages"
      :handle-select-message="handleSelectMessage"
      :handle-deselect-message="handleDeselectMessage"
    />
    <ChatBottom />
  </div>

  <NoChatSelected v-else />
</template>
