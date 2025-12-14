<script setup lang="ts">
import type { IMessage } from "@src/types";

import { computed } from "vue";
import { getAvatarIdFromUrl } from "@src/avatarConfig";

const props = defineProps<{
  message: IMessage;
  searchQuery?: string;
}>();

defineEmits(['click']);

// Extract avatar ID from URL using shared config
const getAvatarName = computed(() => {
  return getAvatarIdFromUrl(props.message.sender.avatar);
});

// Format date to readable format
const formattedDate = computed(() => {
  const date = new Date(props.message.date);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    // Today - show time
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: diffInDays > 365 ? 'numeric' : undefined });
  }
});

// Get message content as string
const messageContent = computed(() => {
  if (typeof props.message.content === 'string') {
    return props.message.content;
  }
  return '[Voice message]';
});

// Highlight search query in message content
const highlightedContent = computed(() => {
  if (!props.searchQuery || !props.searchQuery.trim()) {
    return messageContent.value;
  }
  
  const query = props.searchQuery.trim();
  const regex = new RegExp(`(${query})`, 'gi');
  return messageContent.value.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-600">$1</mark>');
});
</script>

<template>
  <button
    @click="$emit('click')"
    class="w-full p-5 flex outline-none hover:bg-indigo-100 focus:bg-indigo-100 active:bg-indigo-200 dark:hover:bg-gray-600 dark:focus:bg-gray-600 duration-200 transition-colors"
  >
    <!--profile image-->
    <div class="mr-4 flex-shrink-0">
      <div
        :style="{ backgroundImage: `url(${props.message.sender.avatar})` }"
        class="w-7 h-7 rounded-full bg-cover bg-center"
      ></div>
    </div>

    <!--avatar id and message-->
    <div class="grow min-w-0">
      <div class="flex flex-col items-start">
        <p class="text-xs font-semibold text-black/50 dark:text-white/50 mb-1">
          {{ getAvatarName }}
        </p>
        <p class="body-2 text-black/70 dark:text-white/70 line-clamp-2 text-left" v-html="highlightedContent"></p>
      </div>
    </div>

    <!--message date-->
    <div class="flex-shrink-0 ml-4">
      <p class="body-4 text-black/70 dark:text-white/70">{{ formattedDate }}</p>
    </div>
  </button>
</template>
