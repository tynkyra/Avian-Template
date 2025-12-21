<script setup lang="ts">
import cloudPatternPath from "@src/assets/images/pokemon.jpg";
import blurPath from "@src/assets/images/blur.png";
</script>

<template>
  <div
    class="py-12.5 px-12.5 h-full basis-1/2 md:flex xs:hidden items-center justify-center"
  >
    <div
      class="w-full h-full px-7 flex items-center bg-no-repeat bg-center bg-cover rounded-[.75rem]"
      :style="{ 'background-image': `url(${cloudPatternPath})` }"
    >
      <div
        class="px-9 py-15 rounded-[.3125rem] translucent-box"
      >
        <p class="display mb-5 text-white">
          
          <span class="text-gradient">Merry Christmas, Fin!</span>
        </p>
        <p class="body-3 text-white">
          You chose to work on yourself again today. I'm so proud of you! 
          Keep going darling, I'm with you every step of the way.
        </p>
      </div>
    </div>
  </div>
</template>

<!-- Add this custom CSS to your project -->
<style scoped>
.text-gradient {
  background: -webkit-linear-gradient(left top, #de6dce, #e7ddee);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
/* Add translucent box style */
.translucent-box {
  background: rgba(0, 0, 0, 0.489);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
</style>
