<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm">
      <h3 class="text-lg font-semibold mb-2">{{ title }}</h3>
      <p class="mb-4">{{ message }}</p>
      <div class="flex justify-end space-x-2">
        <button
          class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
          @click="$emit('cancel')"
        >
          {{ cancelText }}
        </button>
        <button
          class="px-4 py-2 rounded text-white"
          :class="'bg-indigo-600 hover:bg-indigo-700'"
          @click="$emit('confirm')"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  open: Boolean,
  title: String,
  message: String,
  confirmText: {
    type: String,
    default: 'Confirm',
  },
  cancelText: {
    type: String,
    default: 'Cancel',
  },
  confirmVariant: {
    type: String,
    default: 'primary',
  },
});
</script>
