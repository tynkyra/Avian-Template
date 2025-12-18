<script setup lang="ts">
import { XMarkIcon, ExclamationTriangleIcon } from "@heroicons/vue/24/outline";
import Modal from "@src/components/ui/utils/Modal.vue";
import Button from "@src/components/ui/inputs/Button.vue";

const props = defineProps<{
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const handleConfirm = () => {
  emit('confirm');
};

const handleCancel = () => {
  emit('cancel');
};
</script>

<template>
  <Teleport to="body">
    <Modal :open="props.open" :closeModal="handleCancel">
      <template #content>
        <div class="w-full max-w-md">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <ExclamationTriangleIcon class="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                  {{ props.title }}
                </h2>
              </div>
              <button
                @click="handleCancel"
                class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close"
              >
                <XMarkIcon class="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <!-- Content -->
            <div class="p-6">
              <p class="text-gray-700 dark:text-gray-300">
                {{ props.message }}
              </p>
            </div>

            <!-- Footer -->
            <div class="flex border-t border-gray-200 dark:border-gray-700 overflow-hidden rounded-b-2xl">
              <Button
                @click="handleCancel"
                class="flex-1 !rounded-none"
                variant="secondary"
              >
                {{ props.cancelText || 'Cancel' }}
              </Button>
              <Button
                @click="handleConfirm"
                class="flex-1 !rounded-none !rounded-br-2xl bg-red-100 dark:bg-red-900/30 hover:bg-red-200 text-red-600 dark:text-red-400"
              >
                {{ props.confirmText || 'Confirm' }}
              </Button>
            </div>
          </div>
        </div>
      </template>
    </Modal>
  </Teleport>
</template>
