<template>
  <code class="console overflow-y-auto"
    ref="container">
    <div v-for="(msg, index) in msgs" :key="index"  :class="'d-flex '+getClass(msg.type)">
      <div class="mr-2 text-disabled text-caption">{{ getTimeString(msg.time) }}</div>
      <div class="mr-2">{{ symbols[msg.type] || '' }}</div>
      <div class="mr-2">{{ msg.message }}</div>
      <div v-for="(d, index) in msg.data" :key="index" class="text-disabled mr-2">
        {{ d }}
      </div>
    </div>
  </code>
</template>

<script lang="ts" setup>
import { LogMessage, browserTheme, symbols } from "azadidroid-lib/src/utils/logger"
import { nextTick, onMounted, ref, watch } from "vue"

const props = defineProps<{
  msgs: LogMessage[]
}>()

const container = ref(null)

const getClass = (type: string) => {
  switch(type) {
    case 'error':
      return 'text-red'
    case 'success':
      return 'text-green-lighten-3'
    case 'warn':
      return 'text-orange-lighten-3'
  }
}
const getTimeString = (d: Date) => {
  return [
    d.getHours() < 10 ? '0'+d.getHours() : d.getHours(),
    d.getMinutes() < 10 ? '0'+d.getMinutes() : d.getMinutes(),
    d.getSeconds() < 10 ? '0'+d.getSeconds() : d.getSeconds(),
  ].join(':')
}

const scrollToEnd = () => {
  const el = container.value
  if(!el) return
  el.scrollTop = el.scrollHeight;
}

watch(props.msgs, () => {
  const el = container.value
  if(!el) return
  const isScrollEnd = el.scrollTop + el.offsetHeight>= el.scrollHeight
  if(isScrollEnd) {
    nextTick(() => {
      scrollToEnd()
    })
  }
})

onMounted(() => {
  scrollToEnd()
})

</script>
<style scoped>
.console {
  max-height: 200px;
  display: block;
}

/* width */
::-webkit-scrollbar {
  width: 4px;
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: #888;
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
