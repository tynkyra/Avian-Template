<script setup lang="ts">
import { ref, computed } from "vue";
import type { Ref } from "vue";
import { useRouter } from "vue-router";

import useStore from "@src/store/store";

import Button from "@src/components/ui/inputs/Button.vue";
import TextInput from "@src/components/ui/inputs/TextInput.vue";
import IconButton from "@src/components/ui/inputs/IconButton.vue";
import Modal from "@src/components/ui/utils/Modal.vue";
import { PhotoIcon, XMarkIcon, PencilIcon } from "@heroicons/vue/24/outline";

const props = defineProps<{
  open: boolean;
  closeModal: () => void;
}>();

const store = useStore();
const router = useRouter();

// Chat form data
const chatTitle = ref("New Chat");
const isEditingTitle = ref(false);
const selectedAvatarType = ref<"A" | "B">("A"); // Default to A (left avatar)
const customAvatarFile: Ref<File | null> = ref(null);
const customAvatarPreview = ref("");

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

// Avatar library with 10 Gundams and 9 Pokemon - replace image paths with your own
const gundamAvatars = [
  // Gundam Models (10 total)
  {
    id: "Grandpa",
    name: "RX-78-2 Gundam",
    image: "https://m.media-amazon.com/images/I/511hhV-IVzL._AC_UF894,1000_QL80_.jpg",
  },
  {
    id: "Sazabi",
    name: "MSN-04 Sazabi",
    image: "https://cdnb.artstation.com/p/assets/images/images/059/201/687/large/thomas-fleury-sazabi.jpg?1675864924", // Replace with your image path
    category: "Gundam"
  },
  {
    id: "Nu-Gundam",
    name: "RX-93 Nu Gundam",
    image: "https://yoshstudios.com/wp-content/uploads/2025/08/Render_01-1.jpg", 
    category: "Gundam"
  },
  {
    id: "Barbatos",
    name: "ASW-G-08 Gundam Barbatos",
    image: "https://avatarfiles.alphacoders.com/378/378158.png", // Replace with your image path
    category: "Gundam"
  },
  {
    id: "Wing-Zero",
    name: "XXXG-00W0 Wing Gundam Zero",
    image: "https://www.gunjap.net/site/wp-content/uploads/2020/04/C9E85F15-DEEE-49A0-971D-322C3302CA07.jpeg", // Replace with your image path
    category: "Gundam"
  },
  {
    id: "Strike-Freedom",
    name: "ZGMF-X20A Strike Freedom",
    image: "https://images7.alphacoders.com/124/1243002.jpg", // Replace with your image path
    category: "Gundam"
  },
  {
    id: "Zaku-II",
    name: "MS-06 Zaku II",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSATITRB5cJ76HtwG82036KRi49WHBOIVxG2Q&s",
    category: "Gundam"
  },
  {
    id: "Exia",
    name: "GN-001 Gundam Exia",
    image: "https://i.pinimg.com/474x/7f/d2/9a/7fd29a6ae9f141feec1eef99783f3bf7.jpg", // Replace with your image path
    category: "Gundam"
  },
  {
    id: "Unicorn",
    name: "RX-0 Unicorn Gundam",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKllQOwtk5xt1tWHbCe6msij6MerAkrJcUYg&s", // Replace with your image path
    category: "Gundam"
  },
  {
    id: "Astray-Red",
    name: "MBF-P02 Gundam Astray Red Frame",
    image: "https://mir-s3-cdn-cf.behance.net/project_modules/disp/7412ae67730913.5b4475d4ea08a.jpg", // Replace with a reliable image path
    category: "Gundam"
  },
  // Pokemon (9 total)
  {
    id: "Pikachu",
    name: "Pikachu",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-UVcF-Ajwj5B0zkqNW97jBGO_kbWulw7KsA&s", // Replace with your image path
    category: "Pokemon"
  },
  {
    id: "Snorlax",
    name: "Snorlax",
    image: "https://i.ebayimg.com/00/s/MTI0MFgxNDI0/z/5nIAAOSw4zxl-lK4/$_57.PNG?set_id=8800005007", // Replace with your image path
    category: "Pokemon"
  },
  {
    id: "Gardevoir",
    name: "Gardevoir",
    image: "https://avatarfiles.alphacoders.com/375/thumb-1920-375356.png", // Replace with your image path
    category: "Pokemon"
  },
  {
    id: "Ceruledge",
    name: "Ceruledge",
    image: "https://pbs.twimg.com/media/FkBiL0eXkAEMRZq.png", // Replace with your image path
    category: "Pokemon"
  },
  {
    id: "Rowlett",
    name: "Rowlett",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQN0N6XVFBmfmvq-Y7Qb-DexVxdm6kHJIaJkg&s", // Replace with your image path
    category: "Pokemon"
  },
  {
    id: "Decidueye",
    name: "Decidueye",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSSNS76LF6xwzHHyN44OaAm7df9X-ZXn8JMA&s", // Replace with your image path
    category: "Pokemon"
  },
  {
    id: "Garchomp",
    name: "Garchomp",
    image: "https://i.pinimg.com/736x/8b/1e/4f/8b1e4f2de83c151e642e9f8299e225f1.jpg", // Replace with your image path
    category: "Pokemon"
  },
  {
    id: "Rayquaza",
    name: "Rayquaza",
    image: "https://avatarfiles.alphacoders.com/376/thumb-1920-376165.png", // Replace with your image path
    category: "Pokemon"
  },
  {
    id: "Dialga",
    name: "Dialga",
    image: "https://pm1.aminoapps.com/6130/b75a109d5e540c97754bcecb42f79ca11a19ae9d_hq.jpg", // Replace with your image path
    category: "Pokemon"
  }
];

// Get avatar image by ID
const getAvatarImage = (avatarId: string) => {
  const avatar = gundamAvatars.find(a => a.id === avatarId);
  return avatar ? avatar.image : gundamAvatars[0].image;
};

// Get avatar name by ID
const getAvatarName = (avatarId: string) => {
  const avatar = gundamAvatars.find(a => a.id === avatarId);
  return avatar ? avatar.name : gundamAvatars[0].name;
};

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
const startEditingTitle = () => {
  isEditingTitle.value = true;
  // Focus the input after it renders
  setTimeout(() => {
    const input = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (input) {
      input.focus();
      input.select();
    }
  }, 50);
};

const finishEditingTitle = () => {
  isEditingTitle.value = false;
  if (chatTitle.value.trim() === "") {
    chatTitle.value = "New Chat";
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
    const displayPhoto = groupPicturePreview.value || 
                        "https://gundam-official.com/media/2_FREEDOM_414b8262a7/2_FREEDOM_414b8262a7.png";
    
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
  chatTitle.value = "New Chat";
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
              <TextInput
                v-if="isEditingTitle"
                v-model="chatTitle"
                @blur="finishEditingTitle"
                @keydown="handleTitleKeydown"
                class="heading-1 text-black/70 dark:text-white/70 bg-transparent border-none p-0 focus:ring-0"
                ref="titleInput"
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
                <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">{{ selectedAvatarImages.A }}</p>
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
                <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">{{ selectedAvatarImages.B }}</p>
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
              
              <div class="grid grid-cols-4 gap-6 max-h-64 overflow-y-auto justify-items-center px-4">
                <div
                  v-for="avatar in gundamAvatars.slice(0, 19)"
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
                
                <!-- Upload custom avatar option -->
                <div class="flex flex-col items-center gap-1">
                  <button
                    @click="openFilePicker"
                    class="w-11 h-11 rounded-full border-2 border-dashed border-gray-400 dark:border-gray-500 flex items-center justify-center bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all hover:scale-110"
                    title="Upload custom avatar"
                  >
                    <PhotoIcon class="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                  <span class="text-xs text-gray-600 dark:text-gray-400 text-center">Upload</span>
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
</template>