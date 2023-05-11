<template>
  <div v-if="isModelLoading" class="text-center">
     <v-progress-circular
      :size="50"
      :width="2"
      indeterminate
    ></v-progress-circular>
  </div>
  <div v-else class="pa-3">

    <v-row class="align-center">
      <v-col class="mb-3">
        <code>{{  codename }}</code>
        <h3>{{ model.vendor }} {{ model.name }}</h3>
        <div class="text-medium-emphasis text-caption">{{ model.models.join(', ') }}</div>
      </v-col>
      <v-col v-if="model.image" class="text-right v-col-4">
        <img :src="model.image" alt="Smartphone picture" style="max-width: 100%; max-height: 200px"/>
      </v-col>
    </v-row>
    <table style="width: 100%" class="mt-4">
      <thead class="text-left">
          <th style="width: 20px"></th>
          <th>ROM</th>
          <th>Version</th>
          <th>Android</th>
          <th>Released</th>
      </thead>
      <tbody>
        <ModelinfosRomEntry
          v-for="key in likelyAvailableRoms"
          :key="key"
          :rom="key"
          :codename="codename"
        />
        <ModelinfosRomEntry
          v-for="key in unlikelyAvailableRoms"
          :key="key"
          :rom="key"
          :codename="codename"
          :is-unlikely="true"
        />
      </tbody>
    </table>
  </div>
</template>

<script lang="ts" setup>

import { ModelInfos }  from 'azadidroid-data/src/model/ModelInfos'
import { roms }  from 'azadidroid-data/src/roms/index'
import { getPrefetchedRomAvailability } from "azadidroid-data/src/index"
import { onMounted, computed, ref, watch } from 'vue'
import ModelinfosRomEntry from './ModelInfosRomEntry.vue'



const props = defineProps<{
  codename: string
}>()

const isModelLoading = ref(true)
const isRomsLoading = ref(true)
const model = ref(null)

const romKeys = Object.keys(roms)

const likelyAvailableRoms = computed(() => {
  return getPrefetchedRomAvailability(props.codename)?.roms || []
})

const unlikelyAvailableRoms = computed(() => {
  return romKeys.filter(key => !likelyAvailableRoms.value.includes(key))
})


const load = async () => {
  isModelLoading.value = true
  const codename = props.codename
  try {
    const m = await ModelInfos.get(codename)

    // has route changed in between?
    if(props.codename !== codename) return

    model.value = m
    isModelLoading.value = false
  } catch(err) {
    console.error(err)
  }
}

onMounted(() => {
  load()
})

watch(props, async () => {
  load()
})

</script>
