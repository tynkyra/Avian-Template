<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { Ref } from "vue";
import { useRouter } from "vue-router";

import useStore from "@src/store/store";
import { avatarLibrary, getAvatarImageById, getAvatarNameById } from "@src/avatarConfig";

import Button from "@src/components/ui/inputs/Button.vue";
import IconButton from "@src/components/ui/inputs/IconButton.vue";
import Modal from "@src/components/ui/utils/Modal.vue";
import TextInput from "@src/components/ui/inputs/TextInput.vue";
import { PhotoIcon, XMarkIcon, PencilIcon, PlusIcon } from "@heroicons/vue/24/outline";

const props = defineProps<{
  open: boolean;
  closeModal: () => void;
}>();

const store = useStore();
const router = useRouter();

// Calculate next available chat number
const getNextChatTitle = () => {
  const existingChats = store.conversations
    .filter(c => c.type === 'self_chat')
    .map(c => c.name || '');
  
  // Check if "New Chat" exists
  if (!existingChats.some(name => name.toLowerCase() === 'new chat')) {
    return 'New Chat';
  }
  
  // Find the next available number
  let counter = 1;
  while (existingChats.some(name => name.toLowerCase() === `new chat ${counter}`)) {
    counter++;
  }
  
  return `New Chat ${counter}`;
};

// Chat form data
const chatTitle = ref("New Chat");
const isEditingTitle = ref(false);
const selectedAvatarType = ref<"A" | "B">("A"); // Default to A (left avatar)
const customAvatarFile: Ref<File | null> = ref(null);
const customAvatarPreview = ref("");

// Create avatar modal state
const showCreateAvatarModal = ref(false);
const newAvatarId = ref("");
const newAvatarName = ref("");
const newAvatarImage = ref("");
const newAvatarFile: Ref<File | null> = ref(null);
const newAvatarInputRef: Ref<HTMLInputElement | null> = ref(null);

// Selected avatar images for each slot
const selectedAvatarImages = ref({
  A: "Snorlax", // Default to Snorlax
  B: "Gardevoir"  // Default to Gardevoir
});

// Group picture state
const groupPictureFile: Ref<File | null> = ref(null);
const groupPicturePreview = ref("");
const defaultGroupPicture = "👥"; // Default group emoji

// File input references
const fileInputRef: Ref<HTMLInputElement | null> = ref(null);
const groupPictureInputRef: Ref<HTMLInputElement | null> = ref(null);

// Use shared avatar library
const gundamAvatars = avatarLibrary;
const getAvatarImage = getAvatarImageById;
const getAvatarName = getAvatarNameById;

// Handle custom avatar upload
const handleAvatarUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (file) {
    customAvatarFile.value = file;
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      customAvatarPreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

// Handle group picture upload
const handleGroupPictureUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (file) {
    groupPictureFile.value = file;
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      groupPicturePreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

// Open file picker
const openFilePicker = () => {
  fileInputRef.value?.click();
};

// Open group picture file picker
const openGroupPicturePicker = () => {
  groupPictureInputRef.value?.click();
};

// Handle title editing
const titleInputRef = ref<HTMLInputElement | null>(null);

const startEditingTitle = () => {
  isEditingTitle.value = true;
  // Focus and select all text after it renders
  setTimeout(() => {
    if (titleInputRef.value) {
      titleInputRef.value.focus();
      titleInputRef.value.select();
    }
  }, 0);
};

const finishEditingTitle = () => {
  // Trim the title first
  const trimmedTitle = chatTitle.value.trim();
  
  // Always exit editing mode
  isEditingTitle.value = false;
  
  // Reset to default if empty
  if (trimmedTitle === "") {
    chatTitle.value = "New Chat";
  } else {
    chatTitle.value = trimmedTitle;
  }
};

const handleTitleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Enter") {
    event.preventDefault();
    (event.target as HTMLInputElement).blur();
  }
};

// Handle avatar selection
const selectAvatar = (type: "A" | "B") => {
  selectedAvatarType.value = type;
  customAvatarFile.value = null;
  customAvatarPreview.value = "";
};

// Select avatar from gallery for current slot
const selectAvatarFromGallery = (avatarId: string) => {
  selectedAvatarImages.value[selectedAvatarType.value] = avatarId;
};

// Create new chat
const createNewChat = async () => {
  if (!chatTitle.value.trim()) {
    return; // Don't create chat without title
  }

  try {
    console.log("Creating new chat with title:", chatTitle.value);

    // Check for duplicate names and auto-increment if needed
    let finalTitle = chatTitle.value.trim();
    const existingNames = store.conversations
      .filter(c => c.type === 'self_chat')
      .map(c => c.name?.toLowerCase());
    
    // If title exists, add a number suffix
    if (existingNames.includes(finalTitle.toLowerCase())) {
      let counter = 1;
      while (existingNames.includes(`${finalTitle.toLowerCase()} ${counter}`)) {
        counter++;
      }
      finalTitle = `${finalTitle} ${counter}`;
    }

    // Get the group picture (chat display photo) with default fallback
    const displayPhoto = groupPicturePreview.value || '';
    
    // Get the two selected avatars
    const avatarA = customAvatarPreview.value || getAvatarImage(selectedAvatarImages.value.A);
    const avatarB = getAvatarImage(selectedAvatarImages.value.B);
    
    // Use store API to create conversation for consistency
    const created = await (store as any).createConversation('self_chat', [], finalTitle, displayPhoto, avatarA, avatarB);

    // Focus Messages panel to ensure user sees the list
    if ((store as any).activeSidebarComponent !== undefined) {
      (store as any).activeSidebarComponent = 'messages';
    }

    // Navigate to the newly created conversation
    if (created && created.id) {
      await router.push(`/chat/${created.id}/`);
    }

    // Reset form and close modal
    resetForm();
    props.closeModal();

    console.log('Conversation created via store:', created);
  } catch (error) {
    console.error('Error creating conversation:', error);
  }
};

// Reset form data
const resetForm = () => {
  chatTitle.value = getNextChatTitle();
  isEditingTitle.value = false;
  selectedAvatarType.value = "A"; // Reset to default A
  selectedAvatarImages.value = {
    A: "Snorlax",
    B: "Gardevoir"
  };
  customAvatarFile.value = null;
  customAvatarPreview.value = "";
  groupPictureFile.value = null;
  groupPicturePreview.value = "";
};

// Handle modal close
const handleCloseModal = () => {
  resetForm();
  props.closeModal();
};

// Computed avatar preview
const currentAvatarPreview = computed(() => {
  if (customAvatarPreview.value) {
    return customAvatarPreview.value;
  }
  return getAvatarImage(selectedAvatarImages.value[selectedAvatarType.value]);
});

// Open create avatar modal
const openCreateAvatarModal = () => {
  showCreateAvatarModal.value = true;
};

// Close create avatar modal
const closeCreateAvatarModal = () => {
  showCreateAvatarModal.value = false;
  newAvatarId.value = "";
  newAvatarName.value = "";
  newAvatarImage.value = "";
  newAvatarFile.value = null;
};

// Handle new avatar image upload
const handleNewAvatarImageUpload = (event: Event) => {
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

// Auto-sync avatar name with ID
const handleAvatarIdChange = () => {
  // Always sync name with ID
  newAvatarName.value = newAvatarId.value;
};

// Watch for Avatar ID changes
watch(newAvatarId, (newValue) => {
  newAvatarName.value = newValue;
});

// Watch for modal open to update chat title
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    chatTitle.value = getNextChatTitle();
  }
});

// Create new avatar
const createNewAvatar = () => {
  if (!newAvatarId.value.trim() || !newAvatarImage.value) {
    alert("Please provide an Avatar ID and upload an image.");
    return;
  }

  // Use avatar ID as name if name is empty
  const finalName = newAvatarName.value.trim() || newAvatarId.value.trim();

  // Add to avatar library with category
  avatarLibrary.push({
    id: newAvatarId.value.trim(),
    name: finalName,
    image: newAvatarImage.value,
    category: "Custom"
  });

  console.log('New avatar added to library:', avatarLibrary[avatarLibrary.length - 1]);
  console.log('Total avatars:', avatarLibrary.length);

  // Select the newly created avatar
  selectAvatarFromGallery(newAvatarId.value.trim());

  // Close modal
  closeCreateAvatarModal();
};
</script>

<template>
  <Modal :open="props.open" :close-modal="handleCloseModal">
    <template v-slot:content>
      <div class="w-[28rem] bg-white dark:bg-gray-800 rounded-lg p-6">
        <!--header-->
        <div class="flex justify-between items-center mb-6">
          <div class="flex items-center gap-3">
            <!-- Group picture with edit icon -->
            <div class="relative">
              <button
                @click="openGroupPicturePicker"
                class="w-11 h-11 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center text-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Change group picture"
              >
                <img 
                  v-if="groupPicturePreview" 
                  :src="groupPicturePreview" 
                  alt="Group picture" 
                  class="w-full h-full rounded-full object-cover"
                />
                <span v-else>{{ defaultGroupPicture }}</span>
              </button>
              <!-- Edit icon for group picture -->
              <div class="absolute bottom-0 right-0 w-5 h-5 bg-white dark:bg-gray-800 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center">
                <PencilIcon class="w-3 h-3 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
            
            <!-- Editable title -->
            <div class="flex-1">
              <input
                v-if="isEditingTitle"
                ref="titleInputRef"
                v-model="chatTitle"
                type="text"
                @blur="finishEditingTitle"
                @keydown="handleTitleKeydown"
                class="heading-1 text-black/70 dark:text-white/70 bg-transparent border-none p-0 focus:ring-0 w-full outline-none"
              />
              <h2
                v-else
                @click="startEditingTitle"
                class="heading-1 text-black/70 dark:text-white/70 cursor-pointer hover:text-black dark:hover:text-white transition-colors"
                title="Click to edit title"
              >
                {{ chatTitle }}
              </h2>
            </div>
          </div>
          <IconButton
            @click="handleCloseModal"
            class="ic-btn-ghost-primary w-8 h-8"
            aria-label="Close modal"
            title="Close"
          >
            <XMarkIcon class="w-5 h-5" />
          </IconButton>
        </div>

        <!--form-->
        <div class="space-y-6">

          <!--avatar selection-->
          <div>
            <label class="block body-2 text-black/70 dark:text-white/70 mb-4 font-bold">
              Customise Your Avatars
            </label>
            
            <!--main avatar slots-->
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
                  :title="getAvatarName(selectedAvatarImages.A)"
                >
                  <img
                    :src="getAvatarImage(selectedAvatarImages.A)"
                    :alt="getAvatarName(selectedAvatarImages.A)"
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
                  :title="getAvatarName(selectedAvatarImages.B)"
                >
                  <img
                    :src="getAvatarImage(selectedAvatarImages.B)"
                    :alt="getAvatarName(selectedAvatarImages.B)"
                    class="w-full h-full object-cover"
                  />
                </button>
                <p class="text-xs text-gray-600 dark:text-gray-400 mt-3">{{ selectedAvatarImages.B }}</p>
              </div>
            </div>

            <!-- Selected avatar info -->
            <div class="text-center mb-4">
              <p class="body-2 text-black/70 dark:text-white/70">
                Selected: {{ getAvatarName(selectedAvatarImages[selectedAvatarType]) }}
              </p>
            </div>

            <!--gundam avatar gallery-->
            <div class="border-t border-gray-200 dark:border-gray-600 pt-4">
              <p class="body-2 text-black/70 dark:text-white/70 mb-3 font-semibold">Choose Avatar for {{ selectedAvatarImages[selectedAvatarType] }}:</p>
              
              <div class="grid xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-4 xs:gap-3 max-h-64 overflow-y-auto justify-items-center px-2">
                <div
                  v-for="avatar in gundamAvatars"
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
            
            <!-- Hidden file inputs -->
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              @change="handleAvatarUpload"
              class="hidden"
            />
            
            <!-- Group picture file input -->
            <input
              ref="groupPictureInputRef"
              type="file"
              accept="image/*"
              @change="handleGroupPictureUpload"
              class="hidden"
            />
          </div>

          <!--action buttons-->
          <div class="flex justify-end gap-3 pt-4">
            <Button
              @click="handleCloseModal"
              class="outlined-secondary py-2 px-6"
            >
              Cancel
            </Button>
            <Button
              @click="createNewChat"
              class="filled-primary py-2 px-6"
            >
              Create Chat
            </Button>
          </div>
        </div>
      </div>
    </template>
  </Modal>

  <!-- Create Avatar Modal -->
  <Modal :open="showCreateAvatarModal" :close-modal="closeCreateAvatarModal">
    <template v-slot:content>
      <div class="w-96 bg-white dark:bg-gray-800 rounded-lg p-6">
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
              @change="handleNewAvatarImageUpload"
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
</template>