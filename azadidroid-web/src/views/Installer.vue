
<template>
  <v-container>
    <v-responsive class="d-flex align-center fill-height">
      <v-card :elevation="10" class="ma-7">
        <v-row class="px-4">
          <v-col>
            <h2 class="pa-5">Installer</h2>
          </v-col>
          <DeviceInfo v-if="codename" :isConnected="isConnected" :codename="codename" />
        </v-row>

        <InstallBreadcrumbs :step="curStep" />

        <v-card-text v-if="!isWebusbAvailable">
          <v-alert
            type="error"
            title="Browser not supported"
            text="This installer requires a browser with supports 'WebUSB'."
          ></v-alert>
        </v-card-text>
        <v-card-text v-else>
          <Step0Warning v-if="curStep === 0" @next="next" />
          <Step1Detect v-if="curStep === 1" :phone="ctx.phone" @setCodename="setCodename" />
          <Step2Choose v-if="curStep === 2" :ctx="ctx" @next="next" @back="back" @submit="submit" />
          <Step3Requirements v-if="curStep === 3" :ctx="ctx" :steps="steps.requirements" @next="next" @back="back" />
          <Step4Confirm v-if="curStep === 4" :ctx="ctx" @next="next" @back="reset" />
          <Step5Download v-if="curStep === 5" :ctx="ctx" :fileStore="fileStore" :steps="steps" @next="next" @back="curStep = 1" />
          <Step6Install v-if="curStep === 6" :ctx="ctx" :steps="steps.install" @next="next" @back="curStep = 1" />
          <Step7Finish v-if="curStep === 7" :romName="ctx.rom?.name" @reset="reset" />
        </v-card-text>


        <v-btn
          v-if="curStep > 0"
          variant="plain"
          size="x-small"
          @click="showConsole = !showConsole"
        >
          <template v-slot:prepend>
            <v-icon :icon="showConsole ? 'mdi-chevron-up' : 'mdi-chevron-down'"></v-icon>
          </template>
          Console
        </v-btn>
        <v-expand-transition v-if="curStep > 0">
          <div v-show="showConsole" class="bg-grey">
            <v-card-text>
              <ConsoleEntries :msgs="logMessages" />
            </v-card-text>
          </div>
        </v-expand-transition>
      </v-card>
    </v-responsive>
    <ReconnectDialog v-if="curStep > 1 && curStep < 7" :ctx="ctx" :isInstalling="curStep == 6" @cancel="reset" />
  </v-container>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, shallowRef, unref, watch } from "vue";
import InstallBreadcrumbs from "../components/installer/InstallBreadcrumbs.vue";
import DeviceInfo from "../components/installer/DeviceInfo.vue";
import Step0Warning from "../components/installer/steps/Step0Warning.vue";
import Step1Detect from "../components/installer/steps/Step1Detect.vue";
import Step2Choose from "../components/installer/steps/Step2Choose.vue";
import Step3Requirements from '../components/installer/steps/Step3Requirements.vue';
import Step4Confirm from '../components/installer/steps/Step4Confirm.vue';
import Step5Download from '../components/installer/steps/Step5Download.vue';
import Step6Install from '../components/installer/steps/Step6Install.vue';
import Step7Finish from '../components/installer/steps/Step7Finish.vue';
import ConsoleEntries from "../components/installer/ConsoleEntries.vue";
import USBPhone, { BackgroundErrorEvent, SecurityErrorEvent } from "azadidroid-lib/src/usb/USBPhone.js"
import { logger, LogMessage, removeLogListener, setLogListener } from "azadidroid-lib/src/utils/logger";
import { RomBuild } from "azadidroid-lib/src/roms";
import { roms } from "azadidroid-data/src/roms";
import { getSteps } from "azadidroid-lib/src/steps/index";
import { ModelInfos } from "azadidroid-lib/src/models";
import { type InstallContext } from "azadidroid-lib/src/steps/base"
import ReconnectDialog from '../components/installer/ReconnectDialog.vue'
import { FileStore } from '../store/files'

const curStep = ref(0);
const isConnected = ref(false);
const showConsole = ref(true); // TODO: switch back to false

const logMessages = ref([] as LogMessage[])

const codename = ref();
const ctx = shallowRef<InstallContext|null>({
  files: {},
  phone: null,
  model: null,
  rom: null,
  romBuild: null
})
const steps = shallowRef<any>(() => ({}))
const fileStore = shallowRef(new FileStore)

const reset = () => {
  curStep.value = 1
  isConnected.value = false
  codename.value = ""
  ctx.value.model = null


  if(ctx.value.phone) {
    ctx.value.phone.close()
  }

  ctx.value.phone = new USBPhone()
  ctx.value.phone.addEventListener('backgroundError', (e: any) => {
    logger.error('background error', e.err || e.message || e.name || "")
  })
  ctx.value.phone.addEventListener('disconnected', (e) => {
    isConnected.value = false
  })
  ctx.value.phone.addEventListener('connected', (e) => {
    logger.log('phone connected')
    isConnected.value = true
  })
  ctx.value.phone.addEventListener('reconnected', (e) => {
    isConnected.value = true
  })
  ctx.value.phone.addEventListener('stateChanged', logger.log)
  ctx.value.phone.addEventListener('authSlow', () => {
      logger.log("ADB authentication is still in progress...\nmaybe you need to accept the connection on your phone")
  })
  ctx.value.phone.addEventListener('', (e) => {
    isConnected.value = true
  })

}

const next = () => {
  curStep.value = curStep.value + 1;

  // can step be skipped?
  // if(curStep.value == 3 && steps.value.requirements.length === 0) next()
};
const back = () => {
  curStep.value = curStep.value - 1;
};

const setCodename = async (c: string) => {
  codename.value = c
  ctx.value.model = await ModelInfos.get(c);
  next()
}

const submit = async (data: Partial<InstallContext>) => {
  Object.assign(ctx.value, data)
  if(data.romBuild) {
    steps.value = await getSteps(ctx.value.model, ctx.value.rom, ctx.value.romBuild)
  }
  console.log(ctx.value)
  next()
}

watch(codename, async (newCodename) => {
  if (!newCodename) {
    ctx.value.model = null;
    return;
  }

  // TODO: remove
  // ctx.value.model = await ModelInfos.get(newCodename);
  // submit({
  //   rom: roms.eos,
  //   romBuild: {"date":"2023-08-16","version":"1.14-q","state":"beta","androidVersion":"10","installMethod":"recovery","files":{"rom":{"url":"https://images.ecloud.global/dev/herolte/e-1.14-q-20230816320942-dev-herolte.zip","sha256":"https://images.ecloud.global/dev/herolte/e-1.14-q-20230816320942-dev-herolte.zip.sha256sum"}}}
  // })
  // curStep.value = 5
});

onMounted(() => {
  // codename.value = "herolte" // TODO: remove
  setLogListener((msg) => {
    logMessages.value.push(msg)
  })
  reset()
  curStep.value = 1
})

onUnmounted(() => {
  removeLogListener()
})

// @ts-ignore
const isWebusbAvailable = !!navigator?.usb;
</script>

<script lang="ts">
</script>


<style scoped>
.device {
  line-height: 1em;
}
</style>

<style>
kbd {
  background-color: rgba(0,0,0,0.2);
  padding: 0.1em 0.3em;
  border-radius: 0.4em;
}
</style>
