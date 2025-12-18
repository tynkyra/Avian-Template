<script setup lang="ts">
import type { IConversation } from "@src/types";

import { inject, ref, computed, type Ref } from "vue";

import useStore from "@src/store/store";

import { XCircleIcon, ChevronUpIcon, ChevronDownIcon } from "@heroicons/vue/24/outline";
import IconButton from "@src/components/ui/inputs/IconButton.vue";
import SlideTransition from "@src/components/ui/transitions/SlideTransition.vue";
import MessagePreview from "@src/components/views/HomeView/Chat/MessagePreview.vue";

const store = useStore();

const activeConversation = inject<Ref<IConversation | undefined>>("activeConversation");

// Current index in the pinned messages array
const currentPinnedIndex = ref(0);

// Computed property for current pinned message
const currentPinnedMessage = computed(() => {
  if (!activeConversation?.value?.pinnedMessages || activeConversation.value.pinnedMessages.length === 0) {
    return null;
  }
  return activeConversation.value.pinnedMessages[currentPinnedIndex.value];
});

// Computed property to check if there are multiple pinned messages
const hasPinnedMessages = computed(() => {
  return activeConversation?.value?.pinnedMessages && activeConversation.value.pinnedMessages.length > 0;
});

const pinnedCount = computed(() => {
  return activeConversation?.value?.pinnedMessages?.length || 0;
});

// Navigate to previous pinned message
const handlePrevious = () => {
  if (currentPinnedIndex.value > 0) {
    currentPinnedIndex.value--;
  } else if (pinnedCount.value > 0) {
    currentPinnedIndex.value = pinnedCount.value - 1;
  }
};

// Navigate to next pinned message
const handleNext = () => {
  if (currentPinnedIndex.value < pinnedCount.value - 1) {
    currentPinnedIndex.value++;
  } else {
    currentPinnedIndex.value = 0;
  }
};

// Click on pinned message to navigate
const handleClickPinnedMessage = () => {
  handleNext();
};

// (event) remove the pinned message
const handleRemovePinnedMessage = async () => {
  if (activeConversation?.value && currentPinnedMessage.value) {
    try {
      await store.unpinMessage(activeConversation.value.id, currentPinnedMessage.value.id);
      // Reset index if needed
      if (currentPinnedIndex.value >= pinnedCount.value - 1) {
        currentPinnedIndex.value = Math.max(0, pinnedCount.value - 2);
      }
    } catch (error) {
      console.error('Failed to unpin message:', error);
      alert('Failed to unpin message. Please try again.');
    }
  }
};

// Reset index when conversation changes
import { watch } from "vue";
watch(() => activeConversation?.value?.id, () => {
  currentPinnedIndex.value = 0;
});
</script>

<template>
  <SlideTransition animation="shelf-down">
    <div
      class="absolute z-10 w-full px-5 py-2 bg-white dark:bg-gray-800 flex items-center justify-between transition-all duration-500"
      v-if="hasPinnedMessages && currentPinnedMessage"
    >
      <!--pinned message preview with click to navigate-->
      <div class="flex-1 cursor-pointer" @click="handleClickPinnedMessage">
        <MessagePreview :message="currentPinnedMessage" />
      </div>

      <div class="flex items-center gap-2">
        <!--navigation arrows if multiple pinned messages-->
        <div v-if="pinnedCount > 1" class="flex flex-col items-center">
          <IconButton
            title="previous pinned message"
            aria-label="previous pinned message"
            @click="handlePrevious"
            class="ic-btn-ghost-primary w-7 h-5"
          >
            <ChevronUpIcon class="w-5 h-5" />
          </IconButton>
          <span class="text-xs text-gray-600 dark:text-gray-400">{{ currentPinnedIndex + 1 }}/{{ pinnedCount }}</span>
          <IconButton
            title="next pinned message"
            aria-label="next pinned message"
            @click="handleNext"
            class="ic-btn-ghost-primary w-7 h-5"
          >
            <ChevronDownIcon class="w-5 h-5" />
          </IconButton>
        </div>

        <!--remove pinned Message-->
        <IconButton
          @click="handleRemovePinnedMessage"
          class="ic-btn-ghost-primary w-7 h-7"
          title="unpin this message"
          aria-label="unpin this message"
        >
          <XCircleIcon class="w-5 h-5" />
        </IconButton>
      </div>
    </div>
  </SlideTransition>
</template>
