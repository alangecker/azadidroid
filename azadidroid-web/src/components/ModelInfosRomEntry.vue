<template>
  <tr :class="{'text-disabled': isLight }">
    <td>
      <v-progress-circular
        v-if="isLoading"
        :size="10"
        :width="1"
        indeterminate
      ></v-progress-circular>
      <v-icon v-else-if="error" icon="mdi-close" color="red" />
      <v-icon v-else-if="isAvailable" icon="mdi-file-outline" size="xs" />
    </td>
    <td :colspan="error ? 4 : 1" :class="{'text-decoration-line-through': !isLoading && !isAvailable && !error}">
      {{ romName }}
      <v-tooltip :text="error" v-if="error" location="start">
        <template #activator="{ props }">
          <v-chip color="red" size="small" v-bind="props">Error</v-chip>
        </template>
      </v-tooltip>
    </td>
    <td v-if="!error">
      {{ build.version }}
    </td>
    <td v-if="!error">
      {{ build.androidVersion }}
    </td>
    <td v-if="!error">
      {{ build.date }}
    </td>
  </tr>
</template>

<script lang="ts" setup>

import { roms } from "azadidroid-data/src/roms"
import { computed, onMounted, reactive, ref } from "vue"

const props = defineProps<{
  codename: string,
  rom: string,
  isUnlikely?: boolean
}>()


const romName = computed(() => {
  return roms[props.rom]?.name
})

const isLoading = ref(true)
const isAvailable = ref(false)
const error = ref('')

const build = reactive({
  version: '',
  androidVersion: '',
  date: ''
})

const isLight = computed(() => {
  if(!isLoading.value && isAvailable.value) return false
  return props.isUnlikely
})


onMounted(async () => {
  try {
    const builds = await roms[props.rom].getAvailableBuilds(props.codename)
    if(builds.length) {
      isAvailable.value = true
      build.version = builds[0].version
      build.androidVersion = builds[0].androidVersion || ''
      build.date = builds[0].date
    }
  } catch(err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
})

</script>

<style scoped>
.text-disabled {
  opacity: 0.5;
}
</style>

