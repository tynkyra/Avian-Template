<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { RouterLink } from "vue-router";

import SlideTransition from "@src/components/ui/transitions/SlideTransition.vue";
import PasswordSection from "@src/components/views/AccessView/RegisterForm/PasswordSection.vue";
import PersonalSection from "@src/components/views/AccessView/RegisterForm/PersonalSection.vue";
import useStore from "@src/store/store";

const router = useRouter();
const store = useStore();

// form state
const email = ref("");
const firstName = ref("");
const lastName = ref("");
const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const errorMessage = ref("");

// navigation state
const activeSectionName = ref("personal-section");
const animation = ref("slide-left");

const personalValid = computed(() =>
  !!email.value.trim() && !!firstName.value.trim() && !!lastName.value.trim()
);
const passwordValid = computed(() =>
  !!password.value && password.value === confirmPassword.value
);
const formValid = computed(() => personalValid.value && passwordValid.value);

const changeActiveSection = (event: {
  sectionName: string;
  animationName: string;
}) => {
  animation.value = event.animationName;
  activeSectionName.value = event.sectionName;
};

const goPasswordSection = () => {
  if (!personalValid.value) {
    errorMessage.value = "Please fill email, first, and last name";
    return;
  }
  errorMessage.value = "";
  changeActiveSection({ sectionName: "password-section", animationName: "slide-left" });
};

const handleSignup = async () => {
  if (!formValid.value || loading.value) return;
  errorMessage.value = "";
  loading.value = true;
  try {
    await store.register({
      firstName: firstName.value.trim(),
      lastName: lastName.value.trim(),
      email: email.value.trim(),
      password: password.value,
    });
    router.push("/chat/no-chat/");
  } catch (err: any) {
    errorMessage.value = err?.message || "Sign up failed";
  } finally {
    loading.value = false;
  }
};

const handleBack = () => {
  changeActiveSection({ sectionName: "personal-section", animationName: "slide-right" });
};
</script>

<template>
  <div
    class="p-5 md:basis-1/2 xs:basis-full flex flex-col justify-center items-center"
  >
    <div class="w-full md:px-[26%] xs:px-[10%]">
      <!--header-->
      <div class="mb-6 flex flex-col">
        <img
          src="@src/assets/vectors/logo-gradient.svg"
          class="w-5.5 h-4.5 mb-5 opacity-70"
        />
        <p class="heading-2 text-black/70 dark:text-white/70 mb-4">
          Get started with Avian
        </p>
        <p class="body-3 text-black/75 dark:text-white/70 font-light">
          Sign in to start using messaging!
        </p>
      </div>

      <!--form section-->
      <SlideTransition :animation="animation">
        <component
          :is="activeSectionName === 'personal-section' ? PersonalSection : PasswordSection"
          :email="email"
          :first-name="firstName"
          :last-name="lastName"
          :password="password"
          :confirm-password="confirmPassword"
          :personal-valid="personalValid"
          :password-valid="passwordValid"
          :loading="loading"
          @update:email="(v: string) => (email = v)"
          @update:first-name="(v: string) => (firstName = v)"
          @update:last-name="(v: string) => (lastName = v)"
          @update:password="(v: string) => (password = v)"
          @update:confirm-password="(v: string) => (confirmPassword = v)"
          @next="goPasswordSection"
          @back="handleBack"
          @submit="handleSignup"
        />
      </SlideTransition>

      <p v-if="errorMessage" class="text-red-500 text-sm mt-4">{{ errorMessage }}</p>

      <!--bottom text-->
      <div class="flex justify-center">
        <p class="body-2 text-black/70 dark:text-white/70">
          Already have an account?
          <RouterLink to="/access/sign-in/" class="text-indigo-400 opacity-100">
            Sign in
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
