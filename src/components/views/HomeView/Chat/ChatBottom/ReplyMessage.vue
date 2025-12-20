<script setup lang="ts">
import type { IConversation } from "@src/types";

import { inject, type Ref, computed } from "vue";

import { getConversationIndex } from "@src/utils";
import useStore from "@src/store/store";

import { XCircleIcon } from "@heroicons/vue/24/outline";
import IconButton from "@src/components/ui/inputs/IconButton.vue";
import SlideTransition from "@src/components/ui/transitions/SlideTransition.vue";

import MessagePreview from "@src/components/views/HomeView/Chat/MessagePreview.vue";
import { stringToColor, getFullName } from "@src/utils";

const store = useStore();

const activeConversation = inject<Ref<IConversation | undefined>>("activeConversation");

// (event) removes the reply message from top of the text message textarea
const handleRemoveReplyMessage = () => {
  if (activeConversation?.value) {
    let activeConversationIndex = getConversationIndex(activeConversation.value.id);
    if (
      store.conversations &&
      activeConversationIndex !== undefined &&
      activeConversationIndex !== null
    ) {
      // Use $patch to ensure reactivity
      store.$patch((state) => {
        state.conversations[activeConversationIndex] = {
          ...state.conversations[activeConversationIndex],
          replyMessage: undefined
        };
      });
    }
  }
};
const getReplyMessageWithAvatarType = computed(() => {
  const msg = activeConversation?.value?.replyMessage;
  if (!msg) return undefined;
  if (msg.avatarType) return msg;
  // Infer avatarType by comparing avatar url
  if (msg.sender?.avatar === activeConversation?.value?.avatarA) {
    return { ...msg, avatarType: 'A' };
  } else if (msg.sender?.avatar === activeConversation?.value?.avatarB) {
    return { ...msg, avatarType: 'B' };
  }
  return { ...msg, avatarType: undefined };
});
</script>

<template>
  <div
    v-if="getReplyMessageWithAvatarType"
      class="w-full px-5 pt-4 pb-2 flex items-center justify-between border-t border-gray-200"
    style="background: #fff;"
  >
    <MessagePreview
      :message="getReplyMessageWithAvatarType"
      :color="getReplyMessageWithAvatarType.avatarType === 'A' ? '#2563eb' : getReplyMessageWithAvatarType.avatarType === 'B' ? '#facc15' : '#888888'"
      class="!text-black !opacity-100"
    />

    <IconButton
      @click="handleRemoveReplyMessage"
      class="ic-btn-ghost-primary w-7 h-7"
      title="remove reply"
      aria-label="remove reply"
    >
      <XCircleIcon class="w-5 h-5" />
    </IconButton>
  </div>
</template>


