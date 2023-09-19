<template>
  <v-col :class="`d-flex justify-end align-center ${align == 'left' ? 'flex-row-reverse' : ''}`">
    <div v-if="hasConnectionState">
      <v-tooltip :text="isConnected ? 'Device connected' : 'Connection lost'" location="bottom">
        <template v-slot:activator="{ props }">
          <v-icon icon="mdi-circle-medium" :color="isConnected ? 'green' : 'red'" v-bind="props"></v-icon>
        </template>
      </v-tooltip>
    </div>
    <div :class="`pa-2 device ${align !== 'left' ? 'text-right' : ''}`" style="line-height: 1em">
      <div class="font-weight-bold">{{ productTitle }}</div>
      <code>{{ codename }}</code>
      <ul v-if="withModels && models" class="models">
        <li v-for="model in models" :key="model"><code>{{ model }}</code></li>
      </ul>
    </div>
    <div class="pa-2">
      <img :src="image" :height="withModels ? 150 : 50" />
    </div>
  </v-col>
</template>

<script lang="ts" setup>

import { ModelInfos } from 'azadidroid-data/src/model/ModelInfos'
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  isConnected?: boolean,
  codename: string
  align?: 'left'|'right',
  withModels?: boolean
  // model: Object
}>()

const hasConnectionState = computed(() => {
  return props.isConnected === true || props.isConnected === false
})



const productTitle = ref('')
const image = ref('')
const models = ref([] as string[])

const loadData = async () => {
  if(!props.codename) return
  const model =  await ModelInfos.get(props.codename)
  productTitle.value = model.vendor + ' ' + model.name
  if(productTitle.value.length > 30) productTitle.value = productTitle.value.replace(/\(.*\)/, '')
  image.value = model.image
  models.value = model.models
}

watch(props, () => {
  loadData()
})
onMounted(loadData)


</script>

<style scoped>
.models {
  margin-top: 1em;
  margin-left: 2em;
}
</style>
