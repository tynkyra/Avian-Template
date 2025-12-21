<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";

import Button from "@src/components/ui/inputs/Button.vue";
import LabeledTextInput from "@src/components/ui/inputs/LabeledTextInput.vue";
import PasswordInput from "@src/components/ui/inputs/PasswordInput.vue";
import { RouterLink } from "vue-router";
import useStore from "@src/store/store";

const router = useRouter();
const store = useStore();

const email = ref("");
const password = ref("");
const loading = ref(false);
const errorMessage = ref("");
const rememberMe = ref(true);

const isValid = computed(() => !!email.value.trim() && !!password.value);

const handleEmailChange = (value: string) => {
  email.value = value;
};

const handlePasswordChange = (value: string) => {
  // console.log("Password changed:", value);
  password.value = value;
};

const handleLogin = async () => {
  if (loading.value) return;
  errorMessage.value = "";

  if (!isValid.value) {
    errorMessage.value = "Email and password are required";
    return;
  }

  loading.value = true;
  try {
    console.log('Logging in with', email.value.trim());
    const result = await store.login(email.value.trim(), password.value);
    // Store token in localStorage or sessionStorage based on rememberMe
    if (rememberMe.value) {
      localStorage.setItem('auth_token', result.token);
    } else {
      sessionStorage.setItem('auth_token', result.token);
      localStorage.removeItem('auth_token');
    }
    router.push("/chat");
  } catch (err: any) {
    console.error('Login failed:', err?.status, err?.body || err?.message);
    errorMessage.value = err?.message || "Login failed";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="p-5 md:basis-1/2 xs:basis-full flex flex-col justify-center items-center">
    <div class="w-full md:px-[26%] xs:px-[10%]">
      <!--header-->
      <div class="mb-6 flex flex-col">
        <img src="@src/assets/vectors/pikachuLogoOpaque.png" class="w-11 h-10 mb-4 opacity-100" alt="bird logo" />
        <p class="heading-2 text-black/70 dark:text-white/70 mb-4">
          Welcome back
        </p>
        <p class="body-3 text-black/75 dark:text-white/70 font-light">
          Create an account a start messaging now!
        </p>
      </div>

      <!--form-->
      <div class="mb-6">

        <LabeledTextInput :value="email" @value-changed="handleEmailChange" label="Email" placeholder="Enter your email"
          class="mb-5" />
        <PasswordInput v-model="password" label="Password"
          placeholder="Enter your password" />
      </div>

      <p v-if="errorMessage" class="text-red-500 text-sm mb-4">{{ errorMessage }}</p>

      <!--local controls-->
      <div class="mb-6">
        <Button class="contained-primary contained-text w-full mb-4" :class="[
          'contained-text w-full mb-4',
          isValid ? 'contained-primary' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        ]" :disabled="loading || !isValid" @click="handleLogin">
          {{ loading ? "Signing in..." : "Sign in" }}
        </Button>

        <div class="flex items-center mb-3">
          <input id="rememberMe" type="checkbox" v-model="rememberMe" class="mr-2" checked />
          <label for="rememberMe" class="text-xs text-black/70 dark:text-white/70 select-none cursor-pointer">Remember
            me</label>
        </div>
      </div>

      <!--oauth controls-->
      <div>
        <!--bottom text-->
        <div class="flex justify-center">
          <p class="body-2 text-black/70 dark:text-white/70">
            Don’t have an account?
            <RouterLink to="/access/sign-up/" class="text-indigo-400 opacity-100">
              Sign up
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
