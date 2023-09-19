<template>
  <div>
      <v-progress-linear
        :model-value="percentage"
      ></v-progress-linear>
  </div>
</template>


<script lang="ts" setup>
import type { Step, InstallContext } from "azadidroid-lib/src/steps/base";
import { ref } from "vue";

const props = defineProps<{
  step: Step;
  ctx: InstallContext;
}>();


const percentage = ref(0)

props.step.on("progress", async (p) => {
  percentage.value = p

});
</script>


