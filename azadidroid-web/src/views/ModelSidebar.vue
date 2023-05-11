<template>
    <v-navigation-drawer
      permanent
      location="right"
      :width="400"
    >
      <v-btn :to="{ name: 'ModelList'}" icon="mdi-close" variant="plain"></v-btn>
      <model-infos :codename="$route.params.codename" />
  </v-navigation-drawer>
</template>

<script lang="ts" setup>

import ModelInfos from "../components/ModelInfos.vue";
</script>

