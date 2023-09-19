<template>
  <v-app>
    <default-bar />

    <default-view />
    <router-view name="sidebar"></router-view>
        <!-- <v-list density="compact" nav>
          <v-list-item prepend-icon="mdi-home-city" title="Home" value="home"></v-list-item>
          <v-list-item prepend-icon="mdi-account" title="My Account" value="account"></v-list-item>
          <v-list-item prepend-icon="mdi-account-group-outline" title="Users" value="users"></v-list-item>
        </v-list> -->
    <div v-if="isLoading" class="loading-bar">
      <v-progress-linear height="3" indeterminate></v-progress-linear>
    </div>
  </v-app>
</template>

<script lang="ts" setup>
  import DefaultBar from './AppBar.vue'
  import DefaultView from './View.vue'

  import router from '../../router'
  import { ref } from 'vue'

  const isLoading = ref(false)
  router.beforeEach(() => {
    isLoading.value = true
  })
  router.afterEach(() => {
    isLoading.value = false
  })
</script>
<style scoped>
.loading-bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 2000;
}
</style>
