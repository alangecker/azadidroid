<template>
  <div>
      <v-alert
            type="info"
            class="mt-3"
            icon="mdi-hand-pointing-right"
      >
        <h4>Manually reboot into recovery</h4>
        <ol class="mt-3">
          <li>
            Turn off your device (I know, it is probably advicing you against that, but it's really okay!)
            <ul v-if="powerOffInstructions">
              <li>either by removing the battery</li>
              <li>or by pressing <span v-html="powerOffInstructions"></span> until the display goes off</li>
            </ul>
          </li>
          <li><span v-html="bootIntoRecoveryInstructions"></span></li>
          <li>If you device is in recovery but this still doesn't continue, try unplugging and replugging the USB cable</li>
        </ol>
      </v-alert>
  </div>
</template>


<script lang="ts" setup>
import type { Step, InstallContext } from "azadidroid-lib/src/steps/base"
import { computed } from "vue"

const props = defineProps<{
  ctx: InstallContext,
  step: Step
}>()


const bootIntoRecoveryInstructions = computed(() => {
  console.log(props.ctx.model)
  return props.ctx?.model?.bootIntoRecoveryInstructions || ""
})

const powerOffInstructions = computed(() => {
  return props.ctx?.model?.hardRebootKeys || ""
})
</script>


