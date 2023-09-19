<template>
    <Substep :step="index+1" :cur="cur" :isLoading="isLoading">
      <template #title>
        {{ lang.stepTitle[step.key] || step.key }}
      </template>
      <div class="description" v-if="Handler">
        <Handler :step="step" :ctx="ctx" />
      </div>
      <v-alert
            v-if="error"
            type="error"
            title="Error"
            :text="error"
            class="mt-3"
          ></v-alert>
    </Substep>
</template>

<script lang="ts" setup>
import { Step, type InstallContext } from "azadidroid-lib/src/steps/base"
import lang from 'azadidroid-lib/src/langs/en.js'
import Substep from "../Substep.vue";
import { onMounted, ref, watch, computed } from "vue";
import { logger } from "azadidroid-lib/src/utils/logger";
import handlers from './handler'
import sleep from "azadidroid-lib/src/utils/sleep";

const props = defineProps<{
  step: Step
  index: number,
  cur: number,
  ctx: InstallContext,
  abort: AbortController
}>()
const emit = defineEmits(['done'])

const isLoading = ref(false)
const error = ref("")

const title = computed(() => {
  if(lang.stepTitle[props.step.key]) {
    return lang.stepTitle[props.step.key].replace(/ROM/, props.ctx.rom.name)
  } else {
    return props.step.key
  }
})

// is there a component which should be displayed for this step?
const Handler = handlers[props.step.constructor.name]

onMounted(async() => {
  if(props.index+1 === props.cur) run()
})

watch(props, (props) => {
  if(props.index+1 === props.cur) run()
})

const run = async () =>  {
  isLoading.value = true
  error.value = ""
  try {
      await Promise.all([
        props.step.run(props.ctx, props.abort.signal),

        // wait a least second for better understandability what steps are happening
        sleep(1000)
      ])

      emit('done')
  } catch(err) {
      logger.error(err)
      props.abort.abort(err)
      error.value = err.message
  } finally {
    isLoading.value = false
  }

}

</script>

<style>
.description li {
  margin-left: 2em;
}
</style>
