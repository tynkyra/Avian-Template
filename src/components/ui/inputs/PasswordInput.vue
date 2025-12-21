<script setup lang="ts">
import { ref, nextTick } from "vue";

import LabeledTextInput from "@src/components/ui/inputs/LabeledTextInput.vue";
import { EyeSlashIcon, EyeIcon } from "@heroicons/vue/24/outline";
import IconButton from "@src/components/ui/inputs/IconButton.vue";


const props = defineProps<{
  id?: string;
  type?: string;
  label?: string;
  modelValue?: string;
  placeholder?: string;
  description?: string;
  bordered?: boolean;
  class?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const showPassword = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

function togglePasswordVisibility() {
  const input = inputRef.value;
  let start = 0, end = 0;
  if (input) {
    start = input.selectionStart ?? input.value.length;
    end = input.selectionEnd ?? input.value.length;
  }
  showPassword.value = !showPassword.value;
  nextTick(() => {
    const input = inputRef.value;
    if (input) {
      input.focus();
      input.setSelectionRange(start, end);
    }
  });
}
</script>

<template>
  <LabeledTextInput
    :id="props.id"
    :type="showPassword ? 'text' : 'password'"
    :label="props.label"
    :modelValue="props.modelValue ?? ''"
    :placeholder="props.placeholder"
    :class="props.class"
    :bordered="props.bordered"
    @update:modelValue="(value) => emit('update:modelValue', value)"
    :input-ref="inputRef"
  >
    <template v-slot:endAdornment>
      <IconButton
        title="toggle password visibility"
        aria-label="toggle password visibility"
        class="m-[.5rem] p-2"
        @mousedown.prevent
        @click.stop="togglePasswordVisibility"
      >
        <EyeSlashIcon v-if="showPassword" class="w-5 h-5" />
        <EyeIcon v-else class="w-5 h-5" />
      </IconButton>
    </template>
  </LabeledTextInput>
</template>
