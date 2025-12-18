<script setup lang="ts">
import type { Ref, ComputedRef } from "vue";
import type { IConversation } from "@src/types";

import useStore from "@src/store/store";
import { ref, inject, onMounted, watch } from "vue";
import { getConversationIndex } from "@src/utils";

import {
  CheckIcon,
  FaceSmileIcon,
  MicrophoneIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  XCircleIcon,
} from "@heroicons/vue/24/outline";
import AttachmentsModal from "@src/components/shared/modals/AttachmentsModal/AttachmentsModal.vue";
import Button from "@src/components/ui/inputs/Button.vue";
import IconButton from "@src/components/ui/inputs/IconButton.vue";
import ScaleTransition from "@src/components/ui/transitions/ScaleTransition.vue";
import ReplyMessage from "@src/components/views/HomeView/Chat/ChatBottom/ReplyMessage.vue";
import EmojiPicker from "@src/components/ui/inputs/EmojiPicker/EmojiPicker.vue";
import Textarea from "@src/components/ui/inputs/Textarea.vue";

const store = useStore();

const activeConversation = inject("activeConversation") as ComputedRef<IConversation | undefined>;

// the content of the message.
const value: Ref<string> = ref("");

// track cursor position in textarea
const cursorPosition = ref(0);

// textarea element ref
const textareaRef = ref<HTMLTextAreaElement | null>(null);

// determines whether the app is recording or not.
const recording = ref(false);

// Audio recording state
const mediaRecorder: Ref<MediaRecorder | null> = ref(null);
const audioChunks: Ref<Blob[]> = ref([]);
const recordingDuration = ref(0);
const recordingTimer: Ref<number | null> = ref(null);

// open emoji picker.
const showPicker = ref(false);

// open modal used to send multiple attachments attachments.
const openAttachmentsModal = ref(false);

// File input ref for direct file selection
const attachmentFileInputRef: Ref<HTMLInputElement | null> = ref(null);

// Initial files to pass to modal
const initialAttachmentFiles: Ref<File[]> = ref([]);

// Format duration as MM:SS
const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Start/stop recording
const handleToggleRecording = async () => {
  if (!recording.value) {
    // Start recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      audioChunks.value = [];
      recordingDuration.value = 0;
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.value.push(event.data);
        }
      };
      
      recorder.onstop = async () => {
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Create audio blob and send
        if (audioChunks.value.length > 0 && activeConversation.value) {
          const audioBlob = new Blob(audioChunks.value, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
          
          try {
            // Send recording as attachment
            await store.sendRecording(
              activeConversation.value.id,
              audioFile,
              formatDuration(recordingDuration.value)
            );
          } catch (error) {
            console.error('Failed to send recording:', error);
            alert('Failed to send recording. Please try again.');
          }
        }
        
        // Clear timer
        if (recordingTimer.value) {
          clearInterval(recordingTimer.value);
          recordingTimer.value = null;
        }
      };
      
      recorder.start();
      mediaRecorder.value = recorder;
      recording.value = true;
      
      // Start duration timer
      recordingTimer.value = window.setInterval(() => {
        recordingDuration.value++;
      }, 1000);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to access microphone. Please check your permissions.');
    }
  } else {
    // Stop recording and send
    if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
      mediaRecorder.value.stop();
      recording.value = false;
    }
  }
};

// Cancel recording without sending
const handleCancelRecording = () => {
  if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
    // Stop the recorder
    mediaRecorder.value.stop();
    
    // Stop all audio tracks
    mediaRecorder.value.stream.getTracks().forEach(track => track.stop());
  }
  
  // Clear timer
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value);
    recordingTimer.value = null;
  }
  
  // Clear audio chunks so nothing gets sent
  audioChunks.value = [];
  recordingDuration.value = 0;
  recording.value = false;
};

// close picker when you click outside.
const handleClickOutside = (event: Event) => {
  let target = event.target as HTMLElement;
  let parent = target.parentElement as HTMLElement;

  if (
    target &&
    !target.classList.contains("toggle-picker-button") &&
    parent &&
    !parent.classList.contains("toggle-picker-button")
  ) {
    showPicker.value = false;
  }
};

onMounted(() => {
  value.value = activeConversation.value?.draftMessage || '';
});

// Watch for changes to value and update draft
watch(value, (newValue) => {
  if (!activeConversation.value) return;
  const index = getConversationIndex(activeConversation.value.id);
  if (index !== undefined) {
    store.conversations[index].draftMessage = newValue;
  }
});

// send message function
const handleSendMessage = async () => {
  console.log('handleSendMessage called', { value: value.value, activeConversation: activeConversation.value });
  
  if (!value.value.trim()) {
    console.log('Message is empty, skipping');
    return;
  }
  
  if (!activeConversation.value) {
    console.error('No active conversation');
    return;
  }
  
  try {
    console.log('Sending message:', value.value.trim());
    await store.sendMessage(activeConversation.value.id, value.value.trim());
    value.value = '';
    // Clear draft message
    const index = getConversationIndex(activeConversation.value.id);
    if (index !== undefined) {
      store.conversations[index].draftMessage = '';
    }
  } catch (error) {
    console.error('Failed to send message:', error);
  }
};

// handle enter key
const handleKeyDown = (event: KeyboardEvent) => {
  // Toggle avatar with Tab key
  if (event.key === 'Tab') {
    event.preventDefault();
    store.toggleAvatar();
    return;
  }
  
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleSendMessage();
  }
};

// handle emoji selection
const handleEmojiSelect = (emoji: string) => {
  const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
  if (textarea) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = value.value;
    
    // Insert emoji at cursor position
    value.value = text.substring(0, start) + emoji + text.substring(end);
    
    // Set cursor position after the inserted emoji
    const newPosition = start + emoji.length;
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  } else {
    // Fallback: append to end if textarea not found
    value.value += emoji;
  }
};

// Handle attachments from modal
const handleSendAttachments = async (attachments: File[], caption: string) => {
  if (!activeConversation.value) {
    console.error('No active conversation');
    return;
  }
  
  console.log('[ChatBottom] Received from modal - Attachments:', attachments.length, 'Caption:', caption, 'Caption length:', caption.length);
  
  try {
    // Send attachments using store method
    await store.sendAttachments(
      activeConversation.value.id,
      attachments,
      caption
    );
    
    console.log('✅ Attachments sent successfully');
    
  } catch (error) {
    console.error('Failed to send attachments:', error);
    alert('Failed to send attachments. Please try again.');
  }
  
  // Clear initial files and close modal
  initialAttachmentFiles.value = [];
  openAttachmentsModal.value = false;
};

// Open file picker directly
const handleOpenFilePicker = () => {
  // Clear previous files before opening picker
  initialAttachmentFiles.value = [];
  attachmentFileInputRef.value?.click();
};

// Handle direct file selection
const handleDirectFileSelection = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  
  if (files && files.length > 0) {
    // Set initial files for modal
    initialAttachmentFiles.value = Array.from(files);
    // Open modal with selected files
    openAttachmentsModal.value = true;
  }
};

// Close modal handler that clears initial files
const handleCloseAttachmentsModal = () => {
  initialAttachmentFiles.value = [];
  openAttachmentsModal.value = false;
};
</script>

<template>
  <div class="w-full xs:pb-16 md:pb-0">
    <!--selected reply display-->
    <div
      class="relative transition-all duration-200"
      :class="{ 'pt-15': activeConversation?.replyMessage }"
    >
      <ReplyMessage />
    </div>

    <div
      class="h-auto min-h-21 p-5 flex items-end"
      v-if="store.status !== 'loading'"
      :class="recording ? ['justify-between'] : []"
    >
 

      <div class="min-h-[2.75rem]">
        <!--select attachments button-->
        <IconButton
          v-if="!recording"
          class="ic-btn-ghost-primary w-7 h-7 md:mr-5 xs:mr-4"
          title="open select attachments modal"
          aria-label="open select attachments modal"
          @click="handleOpenFilePicker"
        >
          <PaperClipIcon class="w-[1.25rem] h-[1.25rem]" />
        </IconButton>

        <!--recording timer-->
        <p v-if="recording" class="body-1 text-indigo-300">{{ formatDuration(recordingDuration) }}</p>
      </div>

           <!-- Avatar Bubble -->
      <div class="mr-3 mb-2" v-if="activeConversation">
        <button
          @click="store.toggleAvatar()"
          class="relative w-7 h-7 rounded-full overflow-hidden ring-2 ring-offset-2 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4"
          :class="store.activeAvatar === 'A' 
            ? 'ring-blue-500 focus:ring-blue-300' 
            : 'ring-yellow-500 focus:ring-yellow-300'"
          :title="`Currently speaking as Avatar ${store.activeAvatar}. Click to switch.`"
        >
          <img
            :src="store.activeAvatar === 'A' ? activeConversation.avatarA : activeConversation.avatarB"
            :alt="`Avatar ${store.activeAvatar}`"
            class="w-full h-full object-cover"
          />
          <!-- Active indicator badge -->
          <div 
            class="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold text-white"
            :class="store.activeAvatar === 'A' ? 'bg-blue-500' : 'bg-yellow-500'"
          >
            {{ store.activeAvatar }}
          </div>
        </button>
      </div>

      <!--message textarea-->
      <div class="grow md:mr-5 xs:mr-4 self-end" v-if="!recording">
        <div class="relative">
          <Textarea
            class="max-h-[5rem] pr-12.5 resize-none scrollbar-hidden"
            v-model="value"
            @keydown="handleKeyDown"
            auto-resize
            cols="30"
            rows="1"
            placeholder="Write your message here"
            aria-label="Write your message here"
          />

          <!--emojis-->
          <div class="absolute bottom-[.8125rem] right-0">
            <!--emoji button-->
            <IconButton
              title="toggle emoji picker"
              aria-label="toggle emoji picker"
              @click="showPicker = !showPicker"
              class="ic-btn-ghost-primary toggle-picker-button w-7 h-7 md:mr-5 xs:mr-4"
            >
              <XCircleIcon v-if="showPicker" class="w-[1.25rem] h-[1.25rem]" />
              <FaceSmileIcon
                v-else
                class="w-[1.25rem] h-[1.25rem] text-gray-400 group-hover:text-indigo-300"
              />
            </IconButton>

            <!--emoji picker-->
            <ScaleTransition>
              <div
                v-click-outside="handleClickOutside"
                v-show="showPicker"
                class="absolute z-10 bottom-13.75 md:right-0 xs:right-[-5rem] mt-2"
              >
                <div role="none">
                  <EmojiPicker :show="showPicker" @select-emoji="handleEmojiSelect" />
                </div>
              </div>
            </ScaleTransition>
          </div>
        </div>
      </div>

      <div class="min-h-[2.75rem]">
        <!--cancel recording button-->
        <div v-if="recording" @click="handleCancelRecording">
          <Button class="ghost-danger ghost-text"> Cancel </Button>
        </div>
      </div>

      <div class="min-h-[2.75rem] flex">
        <!--finish recording button-->
        <IconButton
          v-if="recording"
          title="finish recording"
          aria-label="finish recording"
          @click="handleToggleRecording"
          class="relative group w-7 h-7 flex justify-center items-center outline-none rounded-full bg-indigo-300 hover:bg-green-300 dark:hover:bg-green-400 dark:focus:bg-green-400 focus:outline-none transition-all duration-200"
        >
          <span
            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-300 group-hover:bg-green-300 opacity-40"
          >
          </span>

          <MicrophoneIcon
            class="w-[1.25rem] h-[1.25rem] text-white group-hover:hidden"
          />
          <CheckIcon
            class="w-[1.25rem] h-[1.25rem] hidden text-white group-hover:block"
          />
        </IconButton>

        <!--start recording button-->
        <IconButton
          v-else
          @click="handleToggleRecording"
          title="start recording"
          aria-label="start recording"
          class="ic-btn-ghost-primary w-7 h-7 md:mr-5 xs:mr-4"
        >
          <MicrophoneIcon class="w-[1.25rem] h-[1.25rem]" />
        </IconButton>

        <!--send message button-->
        <IconButton
          v-if="!recording"
          @click="handleSendMessage"
          class="ic-btn-contained-primary w-7 h-7 active:scale-110"
          title="send message"
          aria-label="send message"
        >
          <PaperAirplaneIcon class="w-4.25 h-4.25" />
        </IconButton>
      </div>
    </div>
    <AttachmentsModal
      :open="openAttachmentsModal"
      :close-modal="handleCloseAttachmentsModal"
      :initial-files="initialAttachmentFiles"
      @send-attachments="handleSendAttachments"
    />
    
    <!-- Hidden file input for direct attachment selection -->
    <input
      ref="attachmentFileInputRef"
      type="file"
      multiple
      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
      @change="handleDirectFileSelection"
      class="hidden"
    />
  </div>
</template>

<style>
input[placeholder="Search emoji"] {
  background: rgba(0, 0, 0, 0);
}

.v3-emoji-picker .v3-header {
  border-bottom: 0;
}

.v3-emoji-picker .v3-footer {
  border-top: 0;
}
</style>
