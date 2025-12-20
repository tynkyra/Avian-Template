<script setup lang="ts">
import type { IRecording } from "@src/types";
import type { Ref } from "vue";

import { ref, onMounted, onUnmounted, nextTick, watch } from "vue";

import { PauseIcon, PlayIcon } from "@heroicons/vue/24/outline";
import WaveSurfer from "wavesurfer.js";
import Spinner from "@src/components/ui/utils/Spinner.vue";

const props = defineProps<{
  recording: IRecording;
  self?: boolean;
}>();

const wavesurfer: Ref<any> = ref(null);
const playing = ref(false);
const loading = ref(true);
const hasError = ref(false);
const waveformKey = ref(0);

// (event) turns the audio on/off
const handleTogglePlay = () => {
  if (wavesurfer.value) {
    if (playing.value) {
      playing.value = false;
      wavesurfer.value.pause();
    } else {
      playing.value = true;
      wavesurfer.value.play();
    }
  }
};

// when mounted load the audio

function initWaveform() {
  loading.value = true;
  hasError.value = false;
  if (wavesurfer.value) {
    wavesurfer.value.destroy();
    wavesurfer.value = null;
  }
  setTimeout(() => {
    const waveform: HTMLElement | null = document.querySelector(
      "#waveform-" + props.recording.id,
    );
    if (waveform) {
      try {
        wavesurfer.value = WaveSurfer.create({
          container: waveform,
          waveColor: "rgb(209 213 219)",
          progressColor: "rgb(165 180 252)",
          cursorColor: "transparent",
          barWidth: 1,
          barRadius: 1,
          cursorWidth: 1,
          height: 30,
          barGap: 4,
        });
        // load the audio
        console.log('[Recording] Loading audio from:', props.recording.src);
        wavesurfer.value.load(props.recording.src);
        wavesurfer.value.on("ready", function () {
          console.log('[Recording] Audio loaded successfully');
          loading.value = false;
          hasError.value = false;
        });
        wavesurfer.value.on("error", function (err: any) {
          console.error('[Recording] Error loading audio:', err);
          loading.value = false;
          hasError.value = true;
        });
      } catch (error) {
        console.error('[Recording] Error creating WaveSurfer:', error);
      }
    } else {
      console.error('[Recording] Waveform container not found for ID:', props.recording.id);
    }
  }, 100);
}


// Robust watcher: re-initialize waveform when src changes or after refresh when DOM is ready
function robustInitWaveform() {
  let attempts = 0;
  const maxAttempts = 20;
  function tryInit() {
    const waveform = document.querySelector("#waveform-" + props.recording.id);
    if (props.recording.src && waveform) {
      initWaveform();
    } else if (attempts < maxAttempts) {
      attempts++;
      setTimeout(tryInit, 100);
    } else {
      console.warn('[Recording] Could not initialize waveform after multiple attempts');
    }
  }
  tryInit();
}

watch(() => props.recording.src, (newSrc, oldSrc) => {
  waveformKey.value++;
  nextTick(() => {
    robustInitWaveform();
  });
});

onMounted(() => {
  robustInitWaveform();
});

// when the component is unmounted stop the audio
onUnmounted(() => {
  if (wavesurfer.value) {
    wavesurfer.value.pause();
    wavesurfer.value.destroy();
  }
});
</script>

<template>
  <!--loading indicator-->
  <div
    class="flex items-center outline-none"
    tabindex="0"
    aria-label="audio message"
  >
    <div
      v-if="loading"
      class="p-4 mr-4 flex justify-center items-center rounded-[.75rem] outline-none transition-all duration-200 bg-indigo-300 active:bg-indigo-400"
    >
      <Spinner />
    </div>
    <div v-else-if="hasError" class="p-4 mr-4 flex items-center text-xs text-gray-500 dark:text-gray-400">
      Audio unavailable
    </div>

    <!--play/pause button-->
    <button
      v-else
      @click="handleTogglePlay"
      class="p-4 mr-4 flex justify-center items-center rounded-[.75rem] outline-none transition-all duration-200 bg-indigo-300 active:bg-indigo-400"
      :aria-label="playing ? 'pause' : 'play'"
    >
      <PauseIcon v-if="playing" class="w-5 h-5 text-white" />
      <PlayIcon v-else class="w-5 h-5 text-white" />
    </button>

    <!--audio waveform-->
    <div class="w-full mr-4 relative flex items-center">
      <div :id="'waveform-' + props.recording.id" class="w-37.5" :key="waveformKey"></div>
      <div
        class="absolute border animate-pulse w-37.5 border-gray-300"
        v-show="loading"
      ></div>
    </div>

    <p
      class="body-1 text-black dark:text-white opacity-40 dark:opacity-70"
      tabindex="0"
      :aria-label="props.recording.duration"
    >
      {{ props.recording.duration }}
    </p>
  </div>
</template>
