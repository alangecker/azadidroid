<template>
  <v-card-subtitle class="px-4">
    <v-breadcrumbs :items="steps" class="px-0">
      <template v-slot:divider>
        <v-icon icon="mdi-chevron-right"></v-icon>
      </template>
    </v-breadcrumbs>
  </v-card-subtitle>
</template>
<script lang="ts" setup>
import { computed } from "vue"


const props = defineProps<{
  step: number
}>()

const labels = [
  'Connect',
  'Choose',
  'Requirements',
  'Confirm',
  'Download',
  'Install',
  'Finish'
]
const steps = computed(() => {
  return labels.map((l, i) => ({
    title: l,
    disabled: props.step <= i
  }))
})

</script>
