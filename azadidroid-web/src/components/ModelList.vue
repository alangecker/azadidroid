<template>
  <v-container>
    <v-responsive class="d-flex align-center fill-height">
      <!-- <div>As checked @ {{ romsAvailability.scrapeDate }}</div> -->

      <v-row>
        <v-col>
          <v-text-field label="Search..."  prepend-inner-icon="mdi-magnify" v-model="query"></v-text-field>
        </v-col>
        <v-col>
           <v-slider
            v-model="androidVersion"
            :min="MIN_ANDROID_VERSION-1"
            :max="MAX_ANDROID_VERSION"
            :step="1"
            class="ma-4"
            label="Android Version"
            show-ticks="always"
            tick-size="4"
            thumb-label="always"
            thumb-size="15"
          >
            <template #thumb-label="{modelValue}">
              <span style="white-space: nowrap">{{ modelValue > 6 ? '≥ '+modelValue : 'all' }}</span>
            </template>
          </v-slider>
        </v-col>
      </v-row>
      <v-table>
        <thead>
          <tr>
            <th>
              Vendor
            </th>
            <th>
              Model
            </th>
            <th>
              Codename
            </th>
            <th class="text-center">
              Android Version
            </th>
            <th>
              Available ROMs
            </th>
            <th>&nbsp;</th>
          </tr>
        </thead>
        <tbody>
        <tr
          v-for="model in models"
          :key="model.code"
        >
          <td>{{ model.vendor }}</td>
          <td>
            {{ model.name }}
            <div class="text-medium-emphasis text-caption">{{ model.models.join(', ') }}</div>
          </td>
          <td>{{ model.code }}</td>
          <td class="text-center">{{ model.androidVersion }}</td>
          <td>
            <v-chip v-for="rom in model.roms" :key="rom" size="small" class="ma-1">
              {{ romNames[rom] }}
            </v-chip>
            <!-- <span v-for="rom in model.roms" :key="rom" class="v-chip v-theme--light v-chip--density-default v-chip--size-small v-chip--variant-tonal ma-1" draggable="false">
              <span class="v-chip__underlay"></span>
              {{ romNames[rom] }}
            </span> -->
            <span v-if="!model.roms.length" class="text-medium-emphasis text-caption">no ROM found</span>
          </td>
          <td>
            <v-btn :to="{ name: 'Model', params: { codename: model.code } }" icon="mdi-arrow-right" variant="tonal" density="comfortable"></v-btn>
          </td>
        </tr>
      </tbody>
      <tfoot v-if="filteredByVersion.length > maxRows">
        <tr>
          <td colspan="6" class="text-center">
            <!-- not all shown by default for performance reasons -->
            <v-btn @click="maxRows += 50" variant="plain">show more</v-btn>
          </td>
        </tr>
      </tfoot>
      </v-table>
    </v-responsive>
  </v-container>
</template>

<script lang="ts" setup>
import { getModelIndex } from 'azadidroid-data/src/model/models'
import { getPrefetchedRomAvailability } from 'azadidroid-data/src/index'
import { roms } from 'azadidroid-data/src/roms/index'
import { ref, computed } from 'vue'

const allModels = getModelIndex()
  .sort((a,b) => {
    if(a.vendor !== b.vendor) return a.vendor.localeCompare(b.vendor)
    if(a.name !== b.name) return a.name.localeCompare(b.name)
    return 0
  })


const maxRows = ref(50)

const MIN_ANDROID_VERSION = 7
const MAX_ANDROID_VERSION = 13
const query = ref('')
const androidVersion = ref(MIN_ANDROID_VERSION-1)

const romNames = {}
for(let name in roms) {
  romNames[name] = roms[name].name
}


const filteredByQuery = computed(() => {
  const queryLowercase = query.value.toLowerCase()
  return allModels
    .filter((m) =>
      (m.vendor+' '+m.name).toLowerCase().includes(queryLowercase) ||
      m.models.join(',').toLowerCase().includes(queryLowercase) ||
      m.code.toLowerCase().includes(queryLowercase)
    )
})
const modelsWithRoms = computed(() => {
  return filteredByQuery.value
    .map((m) => {
      const device = getPrefetchedRomAvailability(m.code)
      return {
        ...m,
        androidVersion: device?.android,
        roms: device?.roms || []
      }
    })
})

const filteredByVersion = computed(() => {
  if(androidVersion.value < MIN_ANDROID_VERSION) {
    // don't filter
    return modelsWithRoms.value
  }
  return modelsWithRoms.value.filter((m) => m.androidVersion >= androidVersion.value)
})


const models = computed(() => {
  return filteredByVersion.value.slice(0, maxRows.value)
})



</script>
