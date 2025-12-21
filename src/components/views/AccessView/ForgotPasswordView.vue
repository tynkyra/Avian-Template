<script setup lang="ts">
import { ref } from "vue";
import Button from "@src/components/ui/inputs/Button.vue";
import LabeledTextInput from "@src/components/ui/inputs/LabeledTextInput.vue";
import { useRouter } from "vue-router";

const router = useRouter();
const email = ref("");
const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const emailTouched = ref(false);

function validateEmail() {
  if (!email.value) return "Email is required.";
  // Simple email regex
  if (!/^\S+@\S+\.\S+$/.test(email.value)) return "Enter a valid email address.";
  return "";
}

const handleEmailInput = (value: string) => {
  email.value = value;
  if (!emailTouched.value) emailTouched.value = true;
};

const handleSubmit = async () => {
  emailTouched.value = true;
  const err = validateEmail();
  if (err) {
    errorMessage.value = err;
    return;
  }
  errorMessage.value = "";
  loading.value = true;
  try {
    // TODO: Call backend to send reset email
    await new Promise((resolve) => setTimeout(resolve, 1000));
    successMessage.value = "If this email exists, a reset link has been sent.";
  } catch (e) {
    errorMessage.value = "Failed to send reset email.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="p-5 md:basis-1/2 xs:basis-full flex flex-col justify-center items-center">
    <div class="w-full md:px-[26%] xs:px-[10%]">
      <div class="mb-6 flex flex-col">
        <img src="@src/assets/vectors/pikachuLogoOpaque.png" class="w-11 h-10 mb-5 opacity-100" />
        <p class="heading-2 text-black/70 dark:text-white/70 mb-4">Forgot your password?</p>
        <p class="body-3 text-black/75 dark:text-white/70 font-light">
          Enter your email and we'll send you a link to reset your password.
        </p>
      </div>
      <div class="mb-6">
        <LabeledTextInput
          :value="email"
          @value-changed="handleEmailInput"
          label="Email"
          placeholder="Enter your email"
        />
        <div v-if="errorMessage && emailTouched" class="text-red-500 text-xs mt-2">{{ errorMessage }}</div>
        <div v-if="successMessage" class="text-green-600 text-xs mt-2">{{ successMessage }}</div>
      </div>
      <Button
        class="contained-primary contained-text w-full mb-4"
        :disabled="loading || !email"
        :loading="loading"
        @click="handleSubmit"
      >
        Send Reset Link
      </Button>
    </div>
  </div>
</template>
