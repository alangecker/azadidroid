<template>
    <v-alert
    variant="outlined"
    density="compact"
    type="warning"
    title="Data loss!"
  >
    <template #text>
      <p>If you continue all data on your phone will be deleted and {{ ctx.rom.name }} will be installed.</p>
      <p>Do you really want to continue?</p>

      <v-btn class="ma-3" variant="outlined" @click="next">Wipe &amp; Continue</v-btn>
      <v-btn class="ma-3" variant="text" @click="back">Back</v-btn>
    </template>
  </v-alert>
</template>

<script lang="ts" setup>
import { Step } from "azadidroid-lib/src/steps/base"

import { ref } from 'vue'

const props = defineProps(['ctx'])
const emit = defineEmits(['back', 'next'])



const back = () => {
  emit('back')
}

const next = () => {
  emit('next')
}

</script>
