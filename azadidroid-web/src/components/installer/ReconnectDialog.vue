<template>
    <v-dialog
      v-model="showReconnectDialog"
      persistent
      width="400"
    >
        <v-card>
          <v-card-title>Connection to phone lost</v-card-title>
          <v-card-text v-if="isInstalling">
            Most likely the mode has changed and you need to re-authorise the browser to access the device.
            <!-- TODO: show instructions on claim errors -->
          </v-card-text>
          <v-card-text v-else>
            Ensure that the phone is still connected
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="primary"
              variant="elevated"
              :loading="isLoading"
              @click="reconnect"
            >
              Reconnect
            </v-btn>
            <v-btn
              color="blue-darken-1"
              variant="text"
              @click="cancel"
            >
              Cancel
            </v-btn>
          </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
import { InstallContext } from "azadidroid-lib/src/steps/base"
import { BackgroundErrorEvent, SecurityErrorEvent } from "azadidroid-lib/src/usb/USBPhone"
import { logger } from "azadidroid-lib/src/utils/logger"
import { onMounted, onUnmounted, ref } from "vue"


const props = defineProps<{
  ctx: InstallContext,
  isInstalling: boolean

}>()
const emit = defineEmits(['cancel'])

const showReconnectDialog = ref(false)
const isLoading = ref(false)

const reconnect = async () => {
  isLoading.value = true
  try {
    await props.ctx.phone.reconnect(true)
  } catch(err) {
    logger.error(err)
  }
  isLoading.value = false
}

const cancel = () => {
  showReconnectDialog.value = false
  emit('cancel')
}

const onBackgroundError = (e: BackgroundErrorEvent) => {
    logger.log('background error', e)
    if(e instanceof SecurityErrorEvent) {
      showReconnectDialog.value = true
    }
  }

onMounted(() => {
  props.ctx.phone.addEventListener('backgroundError', onBackgroundError)
  props.ctx.phone.addEventListener('connected', (e) => {
    showReconnectDialog.value = false
  })
  props.ctx.phone.addEventListener('reconnected', (e) => {
    showReconnectDialog.value = false
  })
})

onUnmounted(() => {
  props.ctx.phone.removeEventListener('backgroundError', onBackgroundError)
  // TODO: other removeEventListener
})
</script>

