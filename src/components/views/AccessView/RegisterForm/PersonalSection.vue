<script setup lang="ts">
import Button from "@src/components/ui/inputs/Button.vue";
import LabeledTextInput from "@src/components/ui/inputs/LabeledTextInput.vue";

const props = defineProps<{
  email: string;
  firstName: string;
  lastName: string;
  personalValid: boolean;
}>();

const emit = defineEmits([
  'update:email',
  'update:first-name',
  'update:last-name',
  'next'
]);

const handleNext = () => emit('next');
</script>

<template>
  <div>
    <!--form-->
    <div class="mb-5">
      <LabeledTextInput
        :value="props.email"
        @value-changed="(v) => emit('update:email', v)"
        label="Email"
        placeholder="Enter your email"
        class="mb-5"
      />
      <LabeledTextInput
        :value="props.firstName"
        @value-changed="(v) => emit('update:first-name', v)"
        label="First Name"
        placeholder="Enter your first name"
        class="mb-5"
      />
      <LabeledTextInput
        :value="props.lastName"
        @value-changed="(v) => emit('update:last-name', v)"
        label="Last Name"
        placeholder="Enter your last name"
        class="mb-5"
      />
    </div>

    <!--local controls-->
    <div class="mb-6">
      <Button
        :class="[
          'contained-text w-full mb-4',
          props.personalValid ? 'contained-primary' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        ]"
        :disabled="!props.personalValid"
        @click="handleNext"
      >Next</Button>
    </div>

  </div>
</template>
