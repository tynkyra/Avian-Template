<script setup lang="ts">
import { inject, computed, ref, type Ref } from "vue";
import type {
  IConversation,
  IMessage,
  IPreviewData,
  IRecording,
} from "@src/types";

import linkifyStr from "linkify-string";

import { getFullName, getMessageById, formatTime } from "@src/utils";

import Attachments from "@src/components/views/HomeView/Chat/ChatMiddle/Message/Attachments.vue";
import LinkPreview from "@src/components/views/HomeView/Chat/ChatMiddle/Message/LinkPreview.vue";
import MessageContextMenu from "@src/components/views/HomeView/Chat/ChatMiddle/Message/MessageContextMenu.vue";
import Receipt from "@src/components/views/HomeView/Chat/ChatMiddle/Message/Receipt.vue";
import Recording from "@src/components/views/HomeView/Chat/ChatMiddle/Message/Recording.vue";
import { BookmarkIcon } from "@heroicons/vue/24/solid";
import MessagePreview from "@src/components/views/HomeView/Chat/MessagePreview.vue";

const props = defineProps<{
  message: IMessage;
  followUp: boolean;
  self: boolean;
  divider?: boolean;
  selected?: boolean;
  handleSelectMessage: (messageId: number) => void;
  handleDeselectMessage: (messageId: number) => void;
}>();

const activeConversation = inject<Ref<IConversation | undefined>>("activeConversation");

// Check if this message is pinned
const isPinned = computed(() => {
  return activeConversation?.value?.pinnedMessages?.some(pm => pm.id === props.message.id) || false;
});

const showContextMenu = ref(false);

const contextMenuCoordinations: Ref<{ x: number; y: number }> = ref({
  x: 0,
  y: 0,
});

// open context menu.
const handleShowContextMenu = (event: any) => {
  showContextMenu.value = true;
  contextMenuCoordinations.value = {
    x:
      window.innerWidth - 220 <= event.pageX
        ? window.innerWidth - 250
        : event.pageX,
    y:
      window.innerHeight - 300 <= event.pageY
        ? window.innerHeight - 250
        : event.pageY,
  };
};

// closes the context menu
const handleCloseContextMenu = () => {
  showContextMenu.value = false;
};

// close context menu when opening a new one.
const contextConfig = {
  handler: handleCloseContextMenu,
  events: ["contextmenu"],
};

// decide whether to show or hide avatar next to the image.
const hideAvatar = () => {
  // Always show avatar for the first message or after a divider
  if (props.divider) {
    return false;
  }
  
  // Hide avatar only for follow-up messages from the same sender
  if (props.followUp) {
    return true;
  }
  
  // Show avatar for all other cases
  return false;
};

// reply message
const replyMessage = getMessageById(activeConversation, props.message.replyTo);

// Format time as AM/PM in local timezone
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  
  // Get hours and minutes in local timezone
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  
  return `${hours}:${minutesStr} ${ampm}`;
};
</script>

<template>
  <div class="select-none">
    <div class="xs:mb-3 md:mb-2 flex" :class="{ 'justify-end': props.self }">
      <!--avatar left (for Avatar B / non-self messages)-->
      <div v-if="!props.self" class="mr-4" :class="{ 'ml-[2.25rem]': props.followUp && !divider }">
        <div
          v-if="!hideAvatar()"
          :aria-label="getFullName(props.message.sender)"
          class="outline-none"
        >
          <div
            :style="{ backgroundImage: `url(${props.message.sender.avatar})` }"
            class="w-[2.25rem] h-[2.25rem] bg-cover bg-center rounded-full"
          ></div>
        </div>
      </div>

      <div class="flex items-end">
        <!--bubble-->
        <div
          @click="handleCloseContextMenu"
          v-click-outside="contextConfig"
          @contextmenu.prevent="handleShowContextMenu"
          class="group max-w-125 p-5 rounded-b-xl transition duration-500 relative"
          :class="{
            'rounded-tl-xl ml-4 order-2 bg-indigo-50 dark:bg-gray-600':
              props.self && !props.selected,

            'rounded-tr-xl mr-4 bg-gray-50 dark:bg-gray-600':
              !props.self && !props.selected,

            'rounded-tl-xl ml-4 order-2 bg-indigo-200 dark:bg-indigo-500':
              props.self && props.selected,

            'rounded-tr-xl mr-4 bg-indigo-200 dark:bg-indigo-500':
              !props.self && props.selected,
          }"
        >
          <!--reply to-->
          <MessagePreview
            v-if="replyMessage"
            :message="replyMessage"
            :self="props.self"
            class="mb-5 px-3"
          />

          <!--attachments-->
          <Attachments
            v-if="(props.message.attachments as [])?.length > 0"
            :message="props.message"
            :self="props.self"
          />

          <!--caption (content) for attachment messages-->
          <p
            v-if="props.message.content && props.message.type !== 'recording' && props.message.attachments && props.message.attachments.length > 0"
            class="body-2 outline-none text-black opacity-100 dark:text-white dark:opacity-70 mt-4"
            v-html="
              linkifyStr(props.message.content as string, {
                className: props.self
                  ? 'text-black opacity-50'
                  : 'text-indigo-500 dark:text-indigo-300',
                format: {
                  url: (value) =>
                    value.length > 50 ? value.slice(0, 50) + `…` : value,
                },
              })
            "
            tabindex="0"
          ></p>

          <!--content (for regular text messages without attachments)-->
          <p
            v-else-if="props.message.content && props.message.type !== 'recording'"
            class="body-2 outline-none text-black opacity-100 dark:text-white dark:opacity-70"
            v-html="
              linkifyStr(props.message.content as string, {
                className: props.self
                  ? 'text-black opacity-50'
                  : 'text-indigo-500 dark:text-indigo-300',
                format: {
                  url: (value) =>
                    value.length > 50 ? value.slice(0, 50) + `…` : value,
                },
              })
            "
            tabindex="0"
          ></p>

          <!--recording-->
          <div
            v-else-if="
              props.message.content && props.message.type === 'recording'
            "
          >
            <Recording
              :recording="<IRecording>props.message.content"
              :self="props.self"
            />
          </div>

          <!--link preview-->
          <LinkPreview
            v-if="props.message.previewData && !props.message.attachments"
            :self="props.self"
            :preview-data="props.message.previewData as IPreviewData"
            class="mt-5"
          />

          <!--pinned indicator-->
          <div
            v-if="isPinned"
            class="absolute bottom-1 right-1"
          >
            <BookmarkIcon class="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          </div>
        </div>

        <!--time-->
        <div :class="props.self ? ['ml-4', 'order-1'] : ['mr-4']">
          <p class="body-1 text-black/70 dark:text-white/70 whitespace-nowrap">
            {{ formatTime(props.message.date) }}
          </p>
        </div>

        <!--read receipt-->
        <Receipt v-if="props.self" :state="props.message.state" />
      </div>

      <!--avatar right (for Avatar A / self messages)-->
      <div v-if="props.self" class="ml-4" :class="{ 'mr-[2.25rem]': props.followUp && !divider }">
        <div
          v-if="!hideAvatar()"
          :aria-label="getFullName(props.message.sender)"
          class="outline-none"
        >
          <div
            :style="{ backgroundImage: `url(${props.message.sender.avatar})` }"
            class="w-[2.25rem] h-[2.25rem] bg-cover bg-center rounded-full"
          ></div>
        </div>
      </div>
    </div>
    <MessageContextMenu
      :selected="props.selected"
      :message="props.message"
      :show="showContextMenu"
      :left="contextMenuCoordinations.x"
      :top="contextMenuCoordinations.y"
      :handle-close-context-menu="handleCloseContextMenu"
      :handle-select-message="handleSelectMessage"
      :handle-deselect-message="handleDeselectMessage"
    />
  </div>
</template>
