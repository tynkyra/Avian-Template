<script setup lang="ts">
import type { IContact, IConversation } from "@src/types";

import { computed, ref } from "vue";

import { getAvatar, getName, getOddContact, getInitials } from "@src/utils";

import {
  ArrowLeftOnRectangleIcon,
  AtSymbolIcon,
  BellIcon,
  NoSymbolIcon,
  PencilIcon,
  ShareIcon,
  TrashIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/vue/24/outline";
import { ArrowUturnLeftIcon } from "@heroicons/vue/24/solid";
import IconAndText from "@src/components/shared/blocks/IconAndText.vue";
import ImageViewer from "@src/components/shared/modals/ConversationInfoModal/ConversationInfoTab/ImageViewer.vue";
import Button from "@src/components/ui/inputs/Button.vue";
import IconButton from "@src/components/ui/inputs/IconButton.vue";

const props = defineProps<{
  conversation: IConversation;
  contact?: IContact;
  closeModal: () => void;
}>();

const openImageViewer = ref(false);

const imageUrl = computed(() => {
  if (props.contact) {
    return props.contact.avatar;
  } else {
    return getAvatar(props.conversation);
  }
});
</script>

<template>
  <div v-if="props.conversation">
    <div class="mb-6 px-5 flex justify-between items-center">
      <!--title-->
      <p
        class="heading-1 text-black/70 dark:text-white/70"
        id="modal-title"
        tabindex="0"
      >
        <span v-if="conversation.type === 'couple' || props.contact"
          >Contact</span
        >
        <span v-else-if="conversation.type === 'group'">Group</span>
        <span v-else-if="conversation.type === 'broadcast'">Broadcast</span>
        Chat Info
      </p>

      <!--close button-->
      <IconButton
        v-if="!props.contact"
        @click="props.closeModal"
        class="ic-btn-ghost-primary w-8 h-8"
        aria-label="Close modal"
        title="Close"
      >
        <XMarkIcon class="w-5 h-5" />
      </IconButton>

      <!--return button-->
      <IconButton
        v-else
        @click="
          $emit('active-page-change', {
            tabName: 'members',
            animationName: 'slide-right',
          })
        "
        class="ic-btn-outlined-danger p-2"
      >
        <ArrowUturnLeftIcon
          class="w-5 h-5 text-black opacity-50 dark:text-white dark:opacity-70 group-focus:text-red-500 dark:group-focus:text-white group-hover:text-red-500 group-hover:opacity-100 dark:group-hover:text-white"
        />
      </IconButton>
    </div>

    <!--top-->
    <div class="w-full p-5 pb-6">
      <div class="flex items-center">
        <!--avatar-->
        <div class="mr-5">
          <button
            @click="openImageViewer = true"
            class="outline-none"
            aria-label="view avatar"
          >
            <div v-if="getAvatar(props.conversation)"
              :style="{
                backgroundImage: `url(${getAvatar(props.conversation)})`,
              }"
              class="w-9.5 h-9.5 rounded-full bg-cover bg-center"
            ></div>
            <div v-else
              class="w-9.5 h-9.5 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center"
            >
              <span class="text-sm font-semibold text-white">{{ getInitials(props.conversation) }}</span>
            </div>
          </button>
        </div>

        <!--name-->
        <div class="w-full flex justify-between items-center">
          <div>
            <p
              class="heading-2 text-black/70 dark:text-white/70 text-start"
            >
              <span>
                {{ getName(props.conversation) }}
              </span>
            </p>
          </div>

          <IconButton
            title="edit chat"
            v-if="['group', 'broadcast', 'self_chat'].includes(conversation.type)"
            class="ic-btn-ghost-primary w-7 h-7"
            @click="
              $emit('active-page-change', {
                tabName: 'edit-group',
                animationName: 'slide-left',
              })
            "
          >
            <PencilIcon class="w-5 h-5" />
          </IconButton>
        </div>
      </div>

      <!-- Selected Avatars (for self_chat) -->
      <div v-if="conversation.type === 'self_chat'" class="mt-4">
        <p class="body-2 text-black/50 dark:text-white/50 mb-3 text-center">Avatar</p>
        <div class="flex gap-3 justify-center">
          <img
            :src="conversation.avatarA"
            alt="Avatar A"
            class="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500 p-0.5"
          />
          <img
            :src="conversation.avatarB"
            alt="Avatar B"
            class="w-8 h-8 rounded-full object-cover ring-2 ring-yellow-500 p-0.5"
          />
        </div>
      </div>
    </div>

    <!--middle-->
    <div class="w-full py-5 border-t border-gray-100 dark:border-gray-700">
      <!--(contact) email-->
      <div
        v-if="conversation.type === 'couple' || props.contact"
        class="flex px-5 pb-5 items-center"
      >
        <IconAndText
          :icon="AtSymbolIcon"
          :title="getOddContact(props.conversation)?.email"
        />
      </div>

      <!--(group) members-->
      <div
        v-if="
          ['group', 'broadcast'].includes(conversation.type) && !props.contact
        "
        class="px-5 flex items-center pb-5"
      >
        <IconAndText
          :icon="UserIcon"
          title="members"
          link
          chevron
          @click="
            $emit('active-page-change', {
              tabName: 'members',
              animationName: 'slide-left',
            })
          "
        />
      </div>

      <!--(both) notifications-->
      <div class="px-5 flex items-center">
        <IconAndText :icon="BellIcon" title="notifications" switch />
      </div>

      <!--(both) shared media-->
      <div class="px-5 pt-5 flex items-center">
        <IconAndText
          :icon="ShareIcon"
          title="shared media"
          link
          chevron
          @click="
            $emit('active-page-change', {
              tabName: 'shared-media',
              animationName: 'slide-left',
            })
          "
        />
      </div>
    </div>

    <!--bottom-->
    <div class="w-full border-t border-gray-100 dark:border-gray-700">
      <!--(contact) block contact-->
      <div
        v-if="conversation.type === 'couple' || props.contact"
        class="px-5 pt-5 group"
      >
        <IconAndText :icon="NoSymbolIcon" title="block contact" link />
      </div>

      <!--(contact) delete contact-->
      <div
        v-if="conversation.type === 'couple' || props.contact"
        class="px-5 pt-5 group"
      >
        <IconAndText :icon="TrashIcon" title="delete contact" link />
      </div>

      <!--(group) exit group-->
      <div
        v-if="
          ['group', 'broadcast'].includes(conversation.type) && !props.contact
        "
        class="px-5 pt-5 flex items-center group"
      >
        <IconAndText :icon="ArrowLeftOnRectangleIcon" title="exit group" link />
      </div>
    </div>

    <!--image viewer-->
    <ImageViewer
      :image-url="imageUrl"
      :open="openImageViewer"
      :close-image="() => (openImageViewer = false)"
    />
  </div>
</template>
