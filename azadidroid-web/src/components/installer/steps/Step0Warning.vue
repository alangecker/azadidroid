<template>
    <v-alert
    variant="outlined"
    density="compact"
    type="warning"
    title="Early test version"
  >
    <template #text>
      <p>This installer is at a very early stage of development.</p>
      <p>It is very likely that an error will occur in the process and the device cannot be used afterwards without further effort.</p>
      <p>Additionally you will probably lose any warranty claim!</p>

      <v-btn class="ma-3" variant="outlined" @click="$emit('next')">I understand</v-btn>
    </template>
  </v-alert>
</template>
<script lang="ts" setup>
defineEmits(['next'])
</script>
