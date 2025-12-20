<script setup lang="ts">
import type { IConversation } from "@src/types";

import { inject, ref } from "vue";

import router from "@src/router";
import useStore from "@src/store/store";
import { getAvatar, getName, getInitials } from "@src/utils";

import {
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  PencilIcon,
} from "@heroicons/vue/24/outline";
import IconButton from "@src/components/ui/inputs/IconButton.vue";

const props = defineProps<{
  handleOpenInfo: () => void;
  handleOpenSearch: () => void;
}>();

const store = useStore();

const activeConversation = <IConversation>inject("activeConversation");

const toggleSidebar = inject<(() => void) | undefined>('toggleSidebar', undefined);

// (event) toggle sidebar to show conversations list and clear route
const handleCloseConversation = () => {
  // Clear the chat ID from the route
  router.push({ path: "/chat/" });
  
  // Then toggle sidebar to show conversations
  if (toggleSidebar) {
    toggleSidebar();
  }
};
</script>

<template>
  <!--conversation info-->
  <div class="w-full flex justify-center items-center">
    <div class="group mr-4 md:hidden">
      <IconButton
        class="ic-btn-ghost-primary w-7 h-7"
        @click="handleCloseConversation"
        title="close conversation"
        aria-label="close conversation"
      >
        <ChevronLeftIcon class="w-[1.25rem] h-[1.25rem]" />
      </IconButton>
    </div>

    <div v-if="store.status !== 'loading' && activeConversation" class="flex grow">
      <!--avatar-->
      <button
        class="mr-5 outline-none"
        @click="props.handleOpenInfo"
        aria-label="profile avatar"
      >
        <div
          v-if="getAvatar(activeConversation)"
          :style="{
            backgroundImage: `url(${getAvatar(activeConversation)})`,
          }"
          class="w-[2.25rem] h-[2.25rem] rounded-full bg-cover bg-center"
        ></div>
        <div
          v-else
          class="w-[2.25rem] h-[2.25rem] rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center"
        >
          <span class="text-sm font-semibold text-white">{{ getInitials(activeConversation) }}</span>
        </div>
      </button>

      <!--name and last seen-->
      <div class="flex items-center">
        <p
          class="w-fit heading-2 text-black/70 dark:text-white/70 mb-2 cursor-pointer"
          @click="props.handleOpenInfo"
          tabindex="0"
        >
          {{ getName(activeConversation) }}
        </p>
      </div>
    </div>

    <div class="flex" :class="{ hidden: store.status === 'loading' }">
      <!--search button-->
      <IconButton
        title="search messages"
        aria-label="search messages"
        @click="props.handleOpenSearch"
        class="ic-btn-ghost-primary w-7 h-7 mr-3"
      >
        <MagnifyingGlassIcon
          class="w-[1.25rem] h-[1.25rem] text-gray-400 group-hover:text-indigo-300"
        />
      </IconButton>

      <!--edit button-->
      <IconButton
        title="edit conversation"
        aria-label="edit conversation"
        @click="props.handleOpenInfo"
        class="ic-btn-ghost-primary w-7 h-7"
      >
        <PencilIcon
          class="w-[1.25rem] h-[1.25rem] text-gray-400 group-hover:text-indigo-300"
        />
      </IconButton>
    </div>
  </div>
</template>
