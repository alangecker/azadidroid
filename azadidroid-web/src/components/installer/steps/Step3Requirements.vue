<template>
  <div>
    <v-list class="tasklist">
      <v-list-subheader>Veryfing that the device is in a state which allows the installation of {{ ctx.rom.name }}</v-list-subheader>
      <AzadidroidStep v-for="(step, index) in steps" :key="index" :step="step" :index="index" :cur="substep" :ctx="ctx" @done="next" :abort="abort" />
    </v-list>

    <v-card-actions>
        <v-btn
          color="primary"
          variant="text"
          @click="back"
        >
          Go Back
        </v-btn>
      </v-card-actions>
  </div>
</template>

<script lang="ts" setup>
import { InstallContext, Step } from "azadidroid-lib/src/steps/base"
import AzadidroidStep from "./AzadidroidStep.vue";

import { onMounted, ref } from 'vue'

const props = defineProps<{
  steps: Step[],
  ctx: InstallContext
}>()
const emit = defineEmits(['back', 'next'])

const substep = ref(1)

const abort = new AbortController()

const back = () => {
  abort.abort("user goes back")
  emit('back')
}

const next = () => {
  substep.value = substep.value + 1
  if(substep.value > props.steps.length) {
    emit('next')
  }
}

onMounted(() => {
  if(!props.steps.length) emit('next')
})

</script>
