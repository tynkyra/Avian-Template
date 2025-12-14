<script setup lang="ts">
import { ref, watch } from "vue";
import type { Ref } from "vue";
import Attachment from "@src/components/shared/modals/AttachmentsModal/Attachment.vue";
import Button from "@src/components/ui/inputs/Button.vue";
import LabeledTextInput from "@src/components/ui/inputs/LabeledTextInput.vue";
import Modal from "@src/components/ui/utils/Modal.vue";
import ScrollBox from "@src/components/ui/utils/ScrollBox.vue";

const props = defineProps<{
  open: boolean;
  closeModal: () => void;
  initialFiles?: File[];
}>();

const emit = defineEmits<{
  sendAttachments: [attachments: File[], caption: string];
}>();

// File input ref
const fileInputRef: Ref<HTMLInputElement | null> = ref(null);

// Selected files
const selectedFiles: Ref<File[]> = ref([]);

// Caption text
const caption = ref("");

// Open file picker
const handleAddFiles = () => {
  fileInputRef.value?.click();
};

// Handle file selection
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  
  if (files && files.length > 0) {
    // Add new files to existing selection
    selectedFiles.value = [...selectedFiles.value, ...Array.from(files)];
  }
};

// Remove a file from selection
const removeFile = (index: number) => {
  selectedFiles.value = selectedFiles.value.filter((_, i) => i !== index);
};

// Send attachments
const handleSend = () => {
  if (selectedFiles.value.length > 0) {
    emit('sendAttachments', selectedFiles.value, caption.value);
    handleClose();
  }
};

// Close and reset
const handleClose = () => {
  selectedFiles.value = [];
  caption.value = "";
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
  props.closeModal();
};

// Watch for initial files changes
watch(() => props.initialFiles, (files) => {
  if (files && files.length > 0 && props.open) {
    selectedFiles.value = [...files];
  }
}, { immediate: true });

// Reset when modal closes
watch(() => props.open, (isOpen) => {
  if (!isOpen) {
    selectedFiles.value = [];
    caption.value = "";
  } else if (props.initialFiles && props.initialFiles.length > 0) {
    // Load initial files when modal opens
    selectedFiles.value = [...props.initialFiles];
  }
});

// Create attachment objects for display
const attachments = ref<any[]>([]);
watch(selectedFiles, (files) => {
  attachments.value = files.map((file, index) => {
    const attachment: any = {
      id: index,
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    };
    
    // If it's an image, create a preview URL
    if (file.type.startsWith('image/')) {
      attachment.preview = URL.createObjectURL(file);
    }
    
    return attachment;
  });
}, { deep: true });
</script>

<template>
  <Modal :open="props.open" :close-modal="handleClose">
    <template v-slot:content>
      <div class="w-100 bg-white dark:bg-gray-800 rounded py-6">
        <!--attachments list-->
        <div v-if="attachments.length > 0">
          <ScrollBox class="max-h-35 overflow-y-scroll px-5">
            <div v-for="(attachment, index) in attachments" :key="index" class="mb-3">
              <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <!-- Image preview or file icon -->
                  <div v-if="attachment.preview" class="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                    <img :src="attachment.preview" :alt="attachment.name" class="w-full h-full object-cover" />
                  </div>
                  <div v-else class="text-2xl flex-shrink-0">📎</div>
                  
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-black/70 dark:text-white/70 truncate">{{ attachment.name }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ (attachment.size / 1024).toFixed(1) }} KB</p>
                  </div>
                </div>
                <button
                  @click="removeFile(index)"
                  class="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex-shrink-0"
                  title="Remove file"
                >
                  ✕
                </button>
              </div>
            </div>
          </ScrollBox>
        </div>
        
        <div v-else class="px-5 py-8 text-center">
          <p class="body-2 text-gray-500 dark:text-gray-400">No files selected</p>
        </div>

        <!--Caption input-->
        <div class="px-5 py-6">
          <LabeledTextInput v-model="caption" placeholder="Caption" type="text" />
        </div>

        <!--Action buttons-->
        <div class="flex w-full px-5">
          <div class="grow flex justify-start">
            <Button class="ghost-primary ghost-text" @click="handleAddFiles"> Add </Button>
          </div>

          <Button
            class="ghost-primary ghost-text mr-4"
            @click="handleClose"
          >
            Cancel
          </Button>

          <Button 
            class="contained-primary contained-text"
            @click="handleSend"
            :disabled="attachments.length === 0"
          > 
            Send 
          </Button>
        </div>
        
        <!-- Hidden file input -->
        <input
          ref="fileInputRef"
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          @change="handleFileChange"
          class="hidden"
        />
      </div>
    </template>
  </Modal>
</template>
