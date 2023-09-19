<template>
  <v-tooltip
    :text="text"
    location="bottom"
  >
    <template v-slot:activator="{ props }">
      <v-icon
        icon="mdi-information"
        v-bind="props"
        color="primary"
        size="sm"
        class="mx-1"
      ></v-icon>
    </template>
  </v-tooltip>
</template>
<script lang="ts" setup>

defineProps<{
  text: string
}>()
</script>
