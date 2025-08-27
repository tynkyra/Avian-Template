<script setup lang="ts">
const props = defineProps<{
  handleClick?: () => void;
  label?: string;
}>();
</script>

<template>
  <button
    :aria-label="props.label"
    @click.prevent="props.handleClick"
    role="menuitem"
  >
    <slot></slot>
  </button>
</template>
