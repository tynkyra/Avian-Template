<script setup lang="ts">
import type { IAttachment, IMessage } from "@src/types";


import useStore from "@src/store/store";
import { getFullName, hasAttachments, shorten, stringToColor } from "@src/utils";

const props = defineProps<{
  message: IMessage;
  self?: boolean;
  color?: string;
}>();

const store = useStore();

if (import.meta.env.DEV) {
  // Debug: log the color prop to verify value
  console.log('[MessagePreview] color prop:', props.color, 'sender:', props.message?.sender?.email || getFullName(props.message?.sender));
}
</script>

<template>
  
  <div
    v-if="props.message"
    :class="['pl-3', 'cursor-pointer', 'outline-none', 'duration-200']"
    :style="`border-left: 2px solid ${props.color || '#888888'} !important;`"
    tabindex="0"
    :aria-label="'reply to: ' + getFullName(props.message.sender)"
  >
    <!--name-->
    <p
      class="mb-3 font-semibold text-xs leading-4 tracking-[.01rem] text-black"
    >
      {{
        store.user && message.sender.id !== store.user.id
          ? getFullName(props.message.sender)
          : "You"
      }}
    </p>

    <!--content-->
    <p
      v-if="props.message.type !== 'recording' && props.message.content"
      class="body-2 text-black"
    >
      {{ shorten(props.message, 60) }}
    </p>

    <!--attachments title-->
    <p
      v-else-if="hasAttachments(props.message)"
      class="body-2 text-black"
    >
      {{ (props.message?.attachments as IAttachment[])[0].name }}
    </p>

    <!--recording title-->
    <p
      v-else-if="props.message.type === 'recording'"
      class="body-2 text-black"
    >
      recording 23s
    </p>
  </div>
</template>
