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

    <!--divider-->
    <div class="mb-6 flex items-center">
      <span
        class="w-full border border-dashed border-gray-100 dark:border-gray-600 rounded-[.0625rem]"
      ></span>
      <p class="body-3 text-black/75 dark:text-white/70 px-4 font-light">or</p>
      <span
        class="w-full border border-dashed border-gray-100 dark:border-gray-600 rounded-[.0625rem]"
      ></span>
    </div>

    <!--oauth controls-->
    <Button class="outlined-primary outlined-text w-full mb-5">
      <img
        src="@src/assets/vectors/google-logo.svg"
        class="mr-3"
        alt="google-logo"
      />
      Sign in with google
    </Button>
  </div>
</template>
