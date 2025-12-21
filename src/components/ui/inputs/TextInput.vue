<script setup lang="ts">
const emit = defineEmits(["update:modelValue", "valueChanged"]);

import { ref, onMounted, watch } from 'vue';
const props = defineProps<{
  id?: string;
  type?: string;
  modelValue?: string;
  value?: string;
  name?: string;
  placeholder?: string;
  bordered?: boolean;
  inputRef?: any;
}>();

const innerInput = ref<HTMLInputElement | null>(null);
onMounted(() => {
  if (props.inputRef) {
    props.inputRef.value = innerInput.value;
  }
});
watch(() => props.inputRef, (newRef) => {
  if (newRef) {
    newRef.value = innerInput.value;
  }
});

const handleInput = (event: any) => {
  const val = (event.target as HTMLInputElement).value;
  emit("update:modelValue", val);
  emit("valueChanged", val);
};
</script>

<template>
  <input
    ref="innerInput"
    :type="props.type || 'text'"
    name="props.name"
    :id="props.id"
    class="text-input"
    :class="[props.bordered ? 'bordered-input' : 'ringed-input']"
    @input="handleInput"
    :value="props.modelValue ?? props.value ?? ''"
    :placeholder="props.placeholder"
    :key="props.id || props.name || 'password-input'"
  />
</template>
