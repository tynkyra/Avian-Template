<script setup lang="ts">
import type { IConversation, IMessage } from "@src/types";
import { inject, type Ref } from "vue";

import useStore from "@src/store/store";
import { getConversationIndex } from "@src/utils";

import {
  ArrowUturnLeftIcon,
  BookmarkSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClipboardDocumentIcon,
} from "@heroicons/vue/24/outline";
import Dropdown from "@src/components/ui/navigation/Dropdown/Dropdown.vue";
import DropdownLink from "@src/components/ui/navigation/Dropdown/DropdownLink.vue";

const props = defineProps<{
  message: IMessage;
  show: boolean;
  left: number;
  top: number;
  selected: boolean;
  handleCloseContextMenu: () => void;
  handleSelectMessage: (messageId: number) => void;
  handleDeselectMessage: (messageId: number) => void;
  handleRequestDeleteMessage: (messageId: number) => void;
}>();

const store = useStore();

const activeConversation = inject<Ref<IConversation | undefined>>("activeConversation");

// (event) pin message to conversation
const handlePinMessage = async () => {
  props.handleCloseContextMenu();

  if (activeConversation?.value) {
    try {
      await store.pinMessage(activeConversation.value.id, props.message.id);
    } catch (error) {
      console.error('Failed to pin message:', error);
      alert('Failed to pin message. Please try again.');
    }
  }
};

// (event) unpin message from conversation
const handleUnpinMessage = async () => {
  props.handleCloseContextMenu();

  if (activeConversation?.value) {
    try {
      await store.unpinMessage(activeConversation.value.id, props.message.id);
    } catch (error) {
      console.error('Failed to unpin message:', error);
      alert('Failed to unpin message. Please try again.');
    }
  }
};

// (event) select the reply message.
const handleReplyToMessage = () => {
  props.handleCloseContextMenu();
  if (activeConversation?.value) {
    let activeConversationIndex = getConversationIndex(activeConversation.value.id);
    if (
      store.conversations &&
      activeConversationIndex !== undefined &&
      activeConversationIndex !== null
    ) {
      store.conversations[activeConversationIndex].replyMessage = props.message;
    }
  }
};

// (event) copy message text to clipboard
const handleCopyMessage = async () => {
  props.handleCloseContextMenu();
  let text = '';
  if (props.message.type === 'text') {
    text = props.message.content;
  } else if (props.message.type === 'recording') {
    text = '[Voice message]';
  } else if (props.message.type === 'image') {
    text = '[Image]';
  } else if (props.message.type === 'file') {
    text = '[File]';
  } else {
    text = String(props.message.content ?? '');
  }
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    // fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
};

// (event) delete message
const handleDeleteMessage = () => {
  console.log('[MessageContextMenu] Delete clicked for message', props.message.id);
  props.handleCloseContextMenu();
  if (typeof props.handleRequestDeleteMessage === 'function') {
    console.log('[MessageContextMenu] Calling handleRequestDeleteMessage');
    props.handleRequestDeleteMessage(props.message.id);
  } else {
    console.warn('[MessageContextMenu] No handleRequestDeleteMessage prop!');
  }
};

</script>

<template>
  <!--custom context menu-->
  <Dropdown
    :close-dropdown="handleCloseContextMenu"
    :handle-click-outside="handleCloseContextMenu"
    :show="show"
    :coordinates="{
      left: props.left + 'px',
      top: props.top + 'px',
    }"
    :position="['top-0']"
  >
    <button
      class="dropdown-link dropdown-link-primary"
      role="menuitem"
      aria-label="reply to this message"
      @click="handleReplyToMessage"
    >
      <ArrowUturnLeftIcon class="h-5 w-5 mr-3" />
      Reply
    </button>

    <button
      class="dropdown-link dropdown-link-primary"
      role="menuitem"
      aria-label="copy this message"
      @click="handleCopyMessage"
    >
      <ClipboardDocumentIcon class="h-5 w-5 mr-3" />
      Copy
    </button>

    <button
      v-if="activeConversation?.value?.pinnedMessages?.some(pm => pm.id === props.message.id)"
      class="dropdown-link dropdown-link-primary"
      role="menuitem"
      aria-label="unpin this message"
      @click="handleUnpinMessage"
    >
      <BookmarkSquareIcon class="h-5 w-5 mr-3" />
      Unpin
    </button>

    <button
      v-else
      class="dropdown-link dropdown-link-primary"
      role="menuitem"
      aria-label="pin this message"
      @click="handlePinMessage"
    >
      <BookmarkSquareIcon class="h-5 w-5 mr-3" />
      Pin
    </button>

    <button
      v-if="props.selected"
      class="dropdown-link dropdown-link-primary"
      role="menuitem"
      aria-label="deselect this message"
      @click="
        () => {
          handleCloseContextMenu();
          props.handleDeselectMessage(props.message.id);
        }
      "
    >
      <XCircleIcon class="h-5 w-5 mr-3" />
      Deselect
    </button>

    <button
      v-else
      class="dropdown-link dropdown-link-primary"
      role="menuitem"
      aria-label="select this message"
      @click="
        () => {
          handleCloseContextMenu();
          props.handleSelectMessage(props.message.id);
        }
      "
    >
      <CheckCircleIcon class="h-5 w-5 mr-3" />
      Select
    </button>

    <button
      class="dropdown-link dropdown-link-danger"
      role="menuitem"
      aria-label="delete this message"
      @click="handleDeleteMessage"
    >
      <TrashIcon class="h-5 w-5 mr-3" />
      Delete Message
    </button>
  </Dropdown>
</template>
