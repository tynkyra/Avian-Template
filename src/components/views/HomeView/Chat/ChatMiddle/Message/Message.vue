<script setup lang="ts">
import { inject, computed, ref, type Ref, getCurrentInstance } from "vue";
// --- Swipe-to-reply gesture logic ---
const swipeData = ref({
  startX: 0,
  startY: 0,
  deltaX: 0,
  deltaY: 0,
  swiping: false,
});

const swipeThreshold = 60; // px

const handleSwipeStart = (e: TouchEvent | MouseEvent) => {
  swipeData.value.swiping = true;
  if (e instanceof TouchEvent) {
    swipeData.value.startX = e.touches[0].clientX;
    swipeData.value.startY = e.touches[0].clientY;
  } else {
    swipeData.value.startX = e.clientX;
    swipeData.value.startY = e.clientY;
    window.addEventListener('mousemove', handleSwipeMove);
    window.addEventListener('mouseup', handleSwipeEnd);
  }
};

const handleSwipeMove = (e: TouchEvent | MouseEvent) => {
  if (!swipeData.value.swiping) return;
  let clientX, clientY;
  if (e instanceof TouchEvent) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  swipeData.value.deltaX = clientX - swipeData.value.startX;
  swipeData.value.deltaY = clientY - swipeData.value.startY;
};

const handleSwipeEnd = (e: TouchEvent | MouseEvent) => {
  if (!swipeData.value.swiping) return;
  swipeData.value.swiping = false;
  // Only horizontal swipe, ignore vertical
  if (Math.abs(swipeData.value.deltaX) > Math.abs(swipeData.value.deltaY)) {
    // Left message (not self): swipe right to reply
    if (!props.self && swipeData.value.deltaX > swipeThreshold) {
      triggerReply();
    }
    // Right message (self): swipe left to reply
    if (props.self && swipeData.value.deltaX < -swipeThreshold) {
      triggerReply();
    }
  }
  swipeData.value.deltaX = 0;
  swipeData.value.deltaY = 0;
  window.removeEventListener('mousemove', handleSwipeMove);
  window.removeEventListener('mouseup', handleSwipeEnd);
};

const triggerReply = () => {
  // Set replyMessage in activeConversation
  if (activeConversation?.value) {
    activeConversation.value.replyMessage = props.message;
  }
};
import type {
  IConversation,
  IMessage,
  IPreviewData,
  IRecording,
} from "@src/types";

import linkifyStr from "linkify-string";

import { getFullName, getMessageById, stringToColor } from "@src/utils";

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

// reply message with avatarType injected if missing
let replyMessage = getMessageById(activeConversation?.value, props.message.replyTo);
if (replyMessage && !replyMessage.avatarType && activeConversation?.value) {
  if (replyMessage.sender?.avatar === activeConversation.value.avatarA) {
    replyMessage = { ...replyMessage, avatarType: 'A' };
  } else if (replyMessage.sender?.avatar === activeConversation.value.avatarB) {
    replyMessage = { ...replyMessage, avatarType: 'B' };
  }
}

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
          @touchstart="handleSwipeStart"
          @touchmove="handleSwipeMove"
          @touchend="handleSwipeEnd"
          @mousedown="handleSwipeStart"
        >
          <!--reply to-->
          <MessagePreview
            v-if="replyMessage"
            :message="replyMessage"
            :self="props.self"
            :color="replyMessage && replyMessage.avatarType === 'A' ? '#2563eb' : replyMessage && replyMessage.avatarType === 'B' ? '#facc15' : '#888888'"
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
              :recording="typeof props.message.content === 'string' ? JSON.parse(props.message.content) : props.message.content"
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
