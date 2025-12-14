<script setup lang="ts">
import PasswordInput from "@src/components/ui/inputs/PasswordInput.vue";
import Button from "@src/components/ui/inputs/Button.vue";

const props = defineProps<{
  password: string;
  confirmPassword: string;
  passwordValid: boolean;
  loading: boolean;
}>();

const emit = defineEmits([
  'update:password',
  'update:confirm-password',
  'submit',
  'back'
]);

const handleSubmit = () => emit('submit');
const handleBack = () => emit('back');
</script>

<template>
  <div>
    <div class="mb-5">
      <!--form-->
      <PasswordInput
        @valueChanged="(value) => emit('update:password', value)"
        :value="props.password"
        label="Password"
        placeholder="Enter your password"
        class="mb-4"
      />

      <PasswordInput
        @valueChanged="(value) => emit('update:confirm-password', value)"
        :value="props.confirmPassword"
        label="Confirm Password"
        placeholder="Enter your password"
      />
    </div>

    <!--controls-->
    <div class="mb-5">
      <Button
        :class="[
          'contained-text w-full mb-4',
          props.passwordValid ? 'contained-primary' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        ]"
        :disabled="!props.passwordValid || props.loading"
        @click="handleSubmit"
      >
        {{ props.loading ? 'Signing up...' : 'Sign up' }}
      </Button>
      <Button
        class="outlined-primary outlined-text w-full"
        @click="handleBack"
      >
        Back
      </Button>
    </div>
  </div>
</template>
