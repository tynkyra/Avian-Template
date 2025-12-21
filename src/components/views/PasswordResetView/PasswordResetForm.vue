<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import Button from "@src/components/ui/inputs/Button.vue";
import PasswordInput from "@src/components/ui/inputs/PasswordInput.vue";
import { apiService } from "@src/services/api";



const oldPassword = ref("");
const newPassword = ref("");
const confirmNewPassword = ref("");
const router = useRouter();

const newPasswordTouched = ref(false);


const oldPasswordError = ref("");
const newPasswordError = ref("");
const confirmNewPasswordError = ref("");
const formError = ref("");
const success = ref("");
const loading = ref(false);


let oldPasswordValidationCounter = 0;
async function validateOldPassword() {
  const currentValidation = ++oldPasswordValidationCounter;
  oldPasswordError.value = "";
  if (!oldPassword.value) {
    oldPasswordError.value = "Old password is required.";
    return false;
  }
  try {
    await apiService.verifyPassword(oldPassword.value);
    // Only set result if this is the latest validation
    if (currentValidation === oldPasswordValidationCounter) {
      oldPasswordError.value = "";
    }
    return true;
  } catch (e) {
    if (currentValidation === oldPasswordValidationCounter) {
      oldPasswordError.value = "Old password is incorrect.";
    }
    return false;
  }
}

function validateNewPassword() {
  newPasswordError.value = "";
  if (!newPassword.value && newPasswordTouched.value) {
    newPasswordError.value = "New password is required.";
    return false;
  }
  if (newPassword.value && newPassword.value.length < 8) {
    newPasswordError.value = "New password must be at least 8 characters.";
    return false;
  }
  if (oldPassword.value && newPassword.value && oldPassword.value === newPassword.value) {
    newPasswordError.value = "New password must be different from old password.";
    return false;
  }
  return true;
}

function validateConfirmNewPassword() {
  confirmNewPasswordError.value = "";
  if (!confirmNewPassword.value) {
    confirmNewPasswordError.value = "Please confirm your new password.";
    return false;
  }
  if (newPassword.value !== confirmNewPassword.value) {
    confirmNewPasswordError.value = "Passwords do not match.";
    return false;
  }
  return true;
}

async function validateForm() {
  const validOld = await validateOldPassword();
  const validNew = validateNewPassword();
  const validConfirm = validateConfirmNewPassword();
  formError.value = "";
  if (!validOld || !validNew || !validConfirm) {
    formError.value = "Please fix the errors above.";
    return false;
  }
  return true;
}

async function handleReset() {
  if (!(await validateForm())) return;
  loading.value = true;
  formError.value = "";
  success.value = "";
  try {
    await apiService.changePassword(oldPassword.value, newPassword.value);
    success.value = "Password reset successful.";
    oldPassword.value = "";
    newPassword.value = "";
    confirmNewPassword.value = "";
    // Redirect to conversation list after success
    setTimeout(() => {
      router.push("/chat");
    }, 500);
  } catch (e) {
    formError.value = e?.body?.error || "Failed to reset password.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="w-full p-5 flex flex-col justify-center items-center">
    <div class="mb-6 w-87.5">
      <!--header-->
      <div class="mb-6 flex flex-col">
        <img src="@src/assets/vectors/pikachuLogoOpaque.png" class="w-11 h-10 mb-4 opacity-100" alt="bird logo" />
        <p class="heading-2 text-black/70 dark:text-white/70 mb-4">
          Reset Your Password
        </p>
        <p class="body-3 text-black/75 dark:text-white/70 font-light">
          Enter your old password and your new password below to reset your
          password
        </p>
      </div>

      <!--form-->

      <div class="mb-6 ">
        <PasswordInput
          v-model="oldPassword"
          bordered
          label="Old Password"
          placeholder="Enter your password"
          class="mb-1"
          @update:modelValue="() => { validateOldPassword(); validateNewPassword(); }"
        />
        <div v-if="oldPasswordError" class="text-red-500 text-xs mb-2">{{ oldPasswordError }}</div>

        <PasswordInput
          v-model="newPassword"
          bordered
          label="New Password"
          placeholder="Enter your password"
          class="mb-1"
          @update:modelValue="() => { newPasswordTouched.value = true; validateNewPassword(); validateConfirmNewPassword(); }"
        />
        <div v-if="newPasswordError && newPasswordTouched" class="text-red-500 text-xs mb-2">{{ newPasswordError }}</div>

        <PasswordInput
          v-model="confirmNewPassword"
          bordered
          label="Confirm New Password"
          placeholder="Enter your password"
          @update:modelValue="() => { validateConfirmNewPassword(); }"
        />
        <div v-if="confirmNewPasswordError" class="text-red-500 text-xs mb-2">{{ confirmNewPasswordError }}</div>

        <div v-if="formError" class="text-red-500 text-xs mt-2">{{ formError }}</div>
        <div v-if="success" class="text-green-600 text-xs mt-2">{{ success }}</div>
      </div>

      <!--controls-->
      <div>
        <Button
          class="contained-primary contained-text w-full"
          :class="{ 'opacity-50 pointer-events-none': loading || !oldPassword || !newPassword || !confirmNewPassword }"
          :disabled="loading || !oldPassword || !newPassword || !confirmNewPassword"
          :loading="loading"
          @click="handleReset"
        >
          Reset Password
        </Button>
      </div>
    </div>
  </div>
</template>
