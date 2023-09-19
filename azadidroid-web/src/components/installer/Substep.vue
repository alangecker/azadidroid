<template>
  <v-list-item :disabled="step > cur">
    <template #prepend>
      <div class="side">
        <v-progress-circular
          v-if="isLoading && step == cur"
          indeterminate
          :size="18"
          :width="2"
        ></v-progress-circular>
        <v-icon v-else
          :icon="isDone ? 'mdi-check-bold' : 'mdi-circle-outline'"
        ></v-icon>
        </div>
    </template>
    <template #title>
      <div class="font-weight-bold">
        <slot name="title"></slot>
      </div>
    </template>

    <v-expand-transition v-show="step == cur">
      <div>
        <slot></slot>
      </div>
    </v-expand-transition>
  </v-list-item>
</template>

<script lang="ts" setup>
import { computed } from "vue";
const props = defineProps<{
  step: number;
  cur: number;
  isLoading?: boolean;
}>();

const isDone = computed(() => {
  return props.step < props.cur
})
</script>
<style scoped>
.side {
  width: 3em;
}
</style>
