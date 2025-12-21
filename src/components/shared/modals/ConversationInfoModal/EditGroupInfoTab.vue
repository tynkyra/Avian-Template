<script setup lang="ts">
import type { IConversation } from "@src/types";
import type { Ref } from "vue";

import { ref, computed, inject, watch } from "vue";
import { ArrowUturnLeftIcon } from "@heroicons/vue/24/solid";
import { PhotoIcon, PlusIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import Button from "@src/components/ui/inputs/Button.vue";
import IconButton from "@src/components/ui/inputs/IconButton.vue";
import TextInput from "@src/components/ui/inputs/TextInput.vue";
import Modal from "@src/components/ui/utils/Modal.vue";
import { avatarLibrary, getAvatarImageById, getAvatarNameById } from "@src/avatarConfig";
import { getAvatar, getName, getInitials } from "@src/utils";
import useStore from "@src/store/store";
import { apiService } from "@src/services/api";

const props = defineProps<{
  conversation: IConversation;
}>();

const emit = defineEmits(['active-page-change']);

const store = useStore();
const activeConversation = inject<IConversation>("activeConversation");

// Form state
const chatName = ref(getName(props.conversation) || "");
const groupPicturePreview = ref(getAvatar(props.conversation) || "");
const groupPictureFile: Ref<File | null> = ref(null);

// Avatar selection state - store as avatar IDs not URLs
const selectedAvatarType = ref<"A" | "B">("A");

// Create avatar modal state
const showCreateAvatarModal = ref(false);
const newAvatarId = ref("");
const newAvatarName = ref("");
const newAvatarImage = ref("");
const newAvatarFile: Ref<File | null> = ref(null);
const newAvatarInputRef: Ref<HTMLInputElement | null> = ref(null);

// Watch for avatar ID changes and auto-update name
watch(newAvatarId, (newId) => {
  newAvatarName.value = newId;
});

// Get avatar ID from URL
const getAvatarIdFromUrl = (url: string) => {
  if (!url) return "Snorlax";
  const avatar = avatarLibrary.find(a => a.image === url);
  return avatar?.id || "Snorlax";
};

// Initialize with conversation's actual avatars
const selectedAvatarImages = ref({
  A: getAvatarIdFromUrl(props.conversation.avatarA || ""),
  B: getAvatarIdFromUrl(props.conversation.avatarB || "")
});

// File input ref
const groupPictureInputRef: Ref<HTMLInputElement | null> = ref(null);

// Handle group picture upload
const handleGroupPictureUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (file) {
    groupPictureFile.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      groupPicturePreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

// Open group picture file picker
const openGroupPicturePicker = () => {
  groupPictureInputRef.value?.click();
};

// Select avatar from gallery
const selectAvatarFromGallery = (avatarId: string) => {
  selectedAvatarImages.value[selectedAvatarType.value] = avatarId;
};

// Select avatar slot
const selectAvatar = (type: "A" | "B") => {
  selectedAvatarType.value = type;
};

// Handle new avatar image upload
const handleNewAvatarUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (file) {
    newAvatarFile.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      newAvatarImage.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

// Open create avatar modal
const openCreateAvatarModal = () => {
  showCreateAvatarModal.value = true;
  newAvatarId.value = "";
  newAvatarName.value = "";
  newAvatarImage.value = "";
  newAvatarFile.value = null;
};

// Close create avatar modal
const closeCreateAvatarModal = () => {
  showCreateAvatarModal.value = false;
  newAvatarId.value = "";
  newAvatarName.value = "";
  newAvatarImage.value = "";
  newAvatarFile.value = null;
};

// Create new avatar
const createNewAvatar = () => {
  if (!newAvatarId.value.trim() || !newAvatarImage.value) {
    return;
  }

  console.log('Creating new avatar:', {
    id: newAvatarId.value,
    name: newAvatarName.value,
    image: newAvatarImage.value.substring(0, 50) + '...'
  });

  // Add to avatar library
  avatarLibrary.push({
    id: newAvatarId.value,
    name: newAvatarName.value || newAvatarId.value,
    image: newAvatarImage.value,
    category: "Custom"
  });

  console.log('Avatar added to library. Total avatars:', avatarLibrary.length);

  // Select the newly created avatar
  selectedAvatarImages.value[selectedAvatarType.value] = newAvatarId.value;

  // Close modal
  closeCreateAvatarModal();
};

// Save changes
const saveChanges = async () => {
  try {
    const updates = {
      name: chatName.value,
      displayPhoto: groupPicturePreview.value,
      avatarA: getAvatarImageById(selectedAvatarImages.value.A),
      avatarB: getAvatarImageById(selectedAvatarImages.value.B)
    };
    
    console.log('Saving conversation changes:', updates);
    
    // Call store method to update conversation
    await store.updateConversation(props.conversation.id, updates);
    
    console.log('Conversation updated successfully');
    
    // Reload messages to get updated avatar URLs and pinned messages
    const response = await apiService.getMessages(props.conversation.id);
    if (props.conversation.messages) {
      props.conversation.messages = response.messages;
      
      // Populate pinned messages
      if (response.pinnedMessageIds && response.pinnedMessageIds.length > 0) {
        props.conversation.pinnedMessages = response.messages
          .filter(m => response.pinnedMessageIds.includes(m.id))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } else {
        props.conversation.pinnedMessages = [];
      }
    }
    
    console.log('Messages reloaded with updated avatars');
    
    // Return to conversation info
    emit('active-page-change', {
      tabName: 'conversation-info',
      animationName: 'slide-right',
    });
  } catch (error) {
    console.error('Failed to save conversation changes:', error);
    // TODO: Show error notification to user
  }
};
</script>

<template>
  <div class="w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto">
    <!--header-->
    <div class="px-5 mb-6 flex justify-between items-center">
      <div class="flex items-center gap-3">
        <!-- Group picture with edit icon -->
        <div class="relative">
          <button
            @click="openGroupPicturePicker"
            class="w-11 h-11 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center text-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors overflow-hidden"
            title="Change group picture"
          >
            <div
              v-if="getAvatar(props.conversation)"
              :style="{ backgroundImage: `url(${getAvatar(props.conversation)})` }"
              class="w-full h-full rounded-full bg-cover bg-center"
            ></div>
            <div
              v-else
              class="w-full h-full flex items-center justify-center bg-gray-400 dark:bg-gray-600 rounded-full"
            >
              <span class="text-xs font-semibold text-white">
                {{ getInitials(props.conversation) }}
              </span>
            </div>
          </button>
          <!-- Edit icon for group picture -->
          <div class="absolute bottom-0 right-0 w-5 h-5 bg-white dark:bg-gray-800 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center">
            <PhotoIcon class="w-3 h-3 text-gray-600 dark:text-gray-400" />
          </div>
        </div>
        
        <!-- Title -->
        <h2 class="heading-1 text-black/70 dark:text-white/70">
          Edit Chat Info
        </h2>
      </div>

      <!--return button-->
      <IconButton
        @click="
          $emit('active-page-change', {
            tabName: 'conversation-info',
            animationName: 'slide-right',
          })
        "
        class="ic-btn-ghost-primary w-8 h-8"
      >
        <ArrowUturnLeftIcon class="w-5 h-5" />
      </IconButton>
    </div>

    <!--form-->
    <div class="px-5 space-y-6">
      <!-- Chat Name -->
      <div>
        <label class="block body-2 text-black/70 dark:text-white/70 mb-2 font-bold">Chat Name</label>
        <input
          v-model="chatName"
          type="text"
          placeholder="Enter chat name"
          class="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-black/70 dark:text-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <!-- Hidden file input for group picture -->
      <input
        ref="groupPictureInputRef"
        type="file"
        accept="image/*"
        @change="handleGroupPictureUpload"
        class="hidden"
      />

      <!-- Avatar Selection -->
      <div>
        <label class="block body-2 text-black/70 dark:text-white/70 mb-4 font-bold">Customise Your Avatars</label>
        
        <!-- Avatar Slots -->
        <div class="flex justify-center gap-6 mb-6">
          <div class="text-center">
            <button
              @click="selectAvatar('A')"
              :class="[
                'w-20 h-20 rounded-full border-4 flex items-center justify-center overflow-hidden transition-all',
                selectedAvatarType === 'A' ? 
                  'border-blue-500 bg-blue-50 dark:bg-blue-900 shadow-lg scale-105 ring-2 ring-blue-300 dark:ring-blue-500' : 
                  'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 hover:border-gray-400'
              ]"
              :title="getAvatarNameById(selectedAvatarImages.A)"
            >
              <img
                :src="getAvatarImageById(selectedAvatarImages.A)"
                :alt="getAvatarNameById(selectedAvatarImages.A)"
                class="w-full h-full object-cover"
              />
            </button>
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-3">{{ selectedAvatarImages.A }}</p>
          </div>
          
          <div class="text-center">
            <button
              @click="selectAvatar('B')"
              :class="[
                'w-20 h-20 rounded-full border-4 flex items-center justify-center overflow-hidden transition-all',
                selectedAvatarType === 'B' ? 
                  'border-yellow-500 bg-yellow-50 dark:bg-yellow-900 shadow-lg scale-105 ring-2 ring-yellow-300 dark:ring-yellow-500' : 
                  'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 hover:border-gray-400'
              ]"
              :title="getAvatarNameById(selectedAvatarImages.B)"
            >
              <img
                :src="getAvatarImageById(selectedAvatarImages.B)"
                :alt="getAvatarNameById(selectedAvatarImages.B)"
                class="w-full h-full object-cover"
              />
            </button>
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-3">{{ selectedAvatarImages.B }}</p>
          </div>
        </div>

        <!-- Selected avatar info -->
        <div class="text-center mb-4">
          <p class="body-2 text-black/70 dark:text-white/70">
            Selected: {{ getAvatarNameById(selectedAvatarImages[selectedAvatarType]) }}
          </p>
        </div>

        <!-- Avatar Gallery -->
        <div class="border-t border-gray-200 dark:border-gray-600 pt-4">
          <p class="body-2 text-black/70 dark:text-white/70 mb-3 font-semibold">Choose Avatar for {{ selectedAvatarImages[selectedAvatarType] }}:</p>
          
          <div class="grid xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-4 xs:gap-3 max-h-64 overflow-y-auto justify-items-center px-2">
            <div
              v-for="avatar in avatarLibrary"
              :key="avatar.id"
              class="flex flex-col items-center gap-1"
            >
              <button
                @click="selectAvatarFromGallery(avatar.id)"
                :class="[
                  'w-11 h-11 rounded-full border-3 overflow-hidden transition-all hover:scale-110',
                  selectedAvatarImages[selectedAvatarType] === avatar.id ?
                    (selectedAvatarType === 'A' 
                      ? 'border-blue-500 dark:border-blue-400 shadow-lg ring-2 ring-blue-300 dark:ring-blue-500'
                      : 'border-yellow-500 dark:border-yellow-400 shadow-lg ring-2 ring-yellow-300 dark:ring-yellow-500') :
                    'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                ]"
                :title="avatar.name"
              >
                <img
                  :src="avatar.image"
                  :alt="avatar.name"
                  class="w-full h-full object-cover"
                />
              </button>
              <span class="text-xs text-gray-600 dark:text-gray-400 text-center">{{ avatar.id }}</span>
            </div>
            
            <!-- Create custom avatar option -->
            <div class="flex flex-col items-center gap-1">
              <button
                @click="openCreateAvatarModal"
                class="w-11 h-11 rounded-full border-2 border-dashed border-gray-400 dark:border-gray-500 flex items-center justify-center bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all hover:scale-110"
                title="Create custom avatar"
              >
                <PlusIcon class="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
              <span class="text-xs text-gray-600 dark:text-gray-400 text-center">Create</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!--save button-->
    <div class="px-5">
      <Button
        @click="saveChanges"
        class="contained-primary contained-text w-full"
      >
        Save Changes
      </Button>
    </div>

    <!-- Create Avatar Modal -->
    <Modal :open="showCreateAvatarModal" :close-modal="closeCreateAvatarModal">
      <template v-slot:content>
        <div class="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl bg-white dark:bg-gray-800 rounded-lg p-6 mx-auto">
          <div class="flex justify-between items-center mb-6">
            <h2 class="heading-1 text-black/70 dark:text-white/70">Create New Avatar</h2>
            <IconButton
              @click="closeCreateAvatarModal"
              class="ic-btn-ghost-primary w-8 h-8"
              aria-label="Close modal"
              title="Close"
            >
              <XMarkIcon class="w-5 h-5" />
            </IconButton>
          </div>

          <div class="space-y-4">
            <!-- Avatar Image Upload -->
            <div>
              <label class="block body-2 text-black/70 dark:text-white/70 mb-2 font-semibold">
                Avatar Image <span class="text-red-500">*</span>
              </label>
              <div class="flex items-center gap-4">
                <button
                  @click="() => newAvatarInputRef?.click()"
                  class="w-20 h-20 rounded-full border-2 border-dashed border-gray-400 dark:border-gray-500 flex items-center justify-center bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all overflow-hidden"
                >
                  <img v-if="newAvatarImage" :src="newAvatarImage" alt="Preview" class="w-full h-full object-cover" />
                  <PhotoIcon v-else class="w-8 h-8 text-gray-500 dark:text-gray-400" />
                </button>
                <div class="flex-1">
                  <Button
                    @click="() => newAvatarInputRef?.click()"
                    class="outlined-secondary py-2 px-4 w-full"
                  >
                    {{ newAvatarImage ? 'Change Image' : 'Upload Image' }}
                  </Button>
                </div>
              </div>
              <input
                ref="newAvatarInputRef"
                type="file"
                accept="image/*"
                @change="handleNewAvatarUpload"
                class="hidden"
              />
            </div>

            <!-- Avatar ID -->
            <div>
              <label class="block body-2 text-black/70 dark:text-white/70 mb-2 font-semibold">
                Avatar ID <span class="text-red-500">*</span>
              </label>
              <TextInput
                :value="newAvatarId"
                @valueChanged="(val) => newAvatarId = val"
                placeholder="e.g., Gundam, Zaku"
                class="w-full"
              />
            </div>

            <!-- Avatar Name (Optional) -->
            <div>
              <label class="block body-2 text-black/70 dark:text-white/70 mb-2 font-semibold">
                Avatar Name <span class="text-gray-500 text-xs">(Optional)</span>
              </label>
              <TextInput
                :value="newAvatarName"
                @valueChanged="(val) => newAvatarName = val"
                :placeholder="newAvatarId || 'Auto-filled from ID'"
                class="w-full"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Defaults to Avatar ID if left empty
              </p>
            </div>

            <!-- Action Buttons -->
            <div class="flex justify-end gap-3 pt-4">
              <Button
                @click="closeCreateAvatarModal"
                class="outlined-secondary py-2 px-6"
              >
                Cancel
              </Button>
              <Button
                @click="createNewAvatar"
                class="filled-primary py-2 px-6"
                :disabled="!newAvatarId.trim() || !newAvatarImage"
              >
                Create Avatar
              </Button>
            </div>
          </div>
        </div>
      </template>
    </Modal>
  </div>
</template>
