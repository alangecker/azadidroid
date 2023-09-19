<template>
    <v-alert
    variant="outlined"
    density="compact"
    type="success"
    title="Finished"
  >
    <template #text>
      <p>{{ romName }} got successfully installed on your phone!</p>

      <v-btn class="ma-3" variant="outlined" @click="$emit('reset')">Start with new phone</v-btn>
    </template>
  </v-alert>
</template>
<script lang="ts" setup>
defineEmits(['reset'])
const props = defineProps<{
  romName: string
}>()
</script>
