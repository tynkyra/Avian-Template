<script setup lang="ts">
import PasswordInput from "@src/components/ui/inputs/PasswordInput.vue";
import Button from "@src/components/ui/inputs/Button.vue";

import { ref, watch, computed } from 'vue';

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

const passwordTouched = ref(false);
const confirmTouched = ref(false);
const passwordError = ref('');
const confirmError = ref('');

watch(() => props.password, (val) => {
  if (passwordTouched.value) validatePassword();
});
watch(() => props.confirmPassword, (val) => {
  if (confirmTouched.value) validateConfirm();
});

function validatePassword() {
  passwordError.value = '';
  if (!props.password && passwordTouched.value) {
    passwordError.value = 'Password is required.';
    return false;
  }
  if (props.password && props.password.length < 8) {
    passwordError.value = 'Password must be at least 8 characters.';
    return false;
  }
  return true;
}

function validateConfirm() {
  confirmError.value = '';
  if (!props.confirmPassword && confirmTouched.value) {
    confirmError.value = 'Please confirm your password.';
    return false;
  }
  if (props.password && props.confirmPassword && props.password !== props.confirmPassword) {
    confirmError.value = 'Passwords do not match.';
    return false;
  }
  return true;
}


const passwordProxy = computed({
  get: () => props.password,
  set: (val: string) => {
    if (!passwordTouched.value) passwordTouched.value = true;
    emit('update:password', val);
    validatePassword();
    validateConfirm();
  }
});
const confirmPasswordProxy = computed({
  get: () => props.confirmPassword,
  set: (val: string) => {
    if (!confirmTouched.value) confirmTouched.value = true;
    emit('update:confirm-password', val);
    validateConfirm();
  }
});

const isPasswordValid = computed(() => validatePassword());
const isConfirmValid = computed(() => validateConfirm());

const handleSubmit = () => {
  passwordTouched.value = true;
  confirmTouched.value = true;
  if (isPasswordValid.value && isConfirmValid.value) emit('submit');
};
const handleBack = () => emit('back');
</script>

<template>
  <div>
    <div class="mb-5">
      <!--form-->
      <PasswordInput
        v-model="passwordProxy"
        label="Password"
        placeholder="Enter your password"
        class="mb-4"
      />
      <div v-if="passwordError && passwordTouched" class="text-red-500 text-xs mb-2">{{ passwordError }}</div>

      <PasswordInput
        v-model="confirmPasswordProxy"
        label="Confirm Password"
        placeholder="Enter your password"
      />
      <div v-if="confirmError && confirmTouched" class="text-red-500 text-xs mb-2">{{ confirmError }}</div>
    </div>

    <!--controls-->
    <div class="mb-5">
      <Button
        :class="[
          'contained-text w-full mb-4',
          (isPasswordValid && isConfirmValid) ? 'contained-primary' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        ]"
        :disabled="!isPasswordValid || !isConfirmValid || props.loading"
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
