<template>
  <v-app-bar flat class="border-bottom">
    <v-app-bar-title>
      <v-icon icon="mdi-cellphone" />
      <strong>azadi</strong>droid
      <small class="ml-2 text-medium-emphasis text-caption">free your phone</small>
    </v-app-bar-title>

    <template v-slot:append>
      <!-- <v-btn :to="{name: 'Installer'}" variant="flat" class="mr-2">Install</v-btn>
      <v-btn :to="{name: 'ModelList'}"  class="mr-2">List</v-btn> -->
      <v-btn href="https://github.com/alangecker/azadidroid/issues">Issues</v-btn>
      <v-btn icon="mdi-github" href="https://github.com/alangecker/azadidroid"></v-btn>
    </template>
  </v-app-bar>
</template>

<script lang="ts" setup>
  //
</script>

<style scoped>
.border-bottom {
  border-bottom-width: 2px;
}
</style>
