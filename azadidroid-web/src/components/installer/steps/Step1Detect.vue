<template>
  <div>
    <v-list class="tasklist">
      <!-- Enable Android Debugging -->
      <Substep :step="1" :cur="substep">
        <template #title>
          Enable <i>Android Debugging</i>
          <Info
            text="Android Debugging (ADB) allows the phone to be accessed via USB"
          />
          on your phone
        </template>

        <p class="py-2">
          Open your phone’s app drawer, tap the Settings icon, and select “About
          Phone”. Scroll all the way down and tap the “Build Number” item seven
          times. You should get a message saying you are now a developer.
        </p>

        <p class="py-2">
          Head back to the main Settings page, and you should see a new option
          in the “System” section called “Developer Options.” Open that, and
          enable “USB Debugging.”
        </p>

        <p class="pa-3">
          <v-btn color="primary" class="text-none" @click="substep = 2"
            >Android Debugging is activated *</v-btn
          >
        </p>
        <div class="text-disabled py-2">
          * If you know what you are doing and how to, you can also connect the
          phone in fastboot/download mode or with an ADB enabled recovery
        </div>
      </Substep>

      <!-- Connect the device  -->
      <Substep :step="2" :cur="substep" :isLoading="isConnecting">
        <template #title> Connect the device </template>

        <p>
          Connect the phone to this computer with an USB cable, press "Connect"
          and then select your phone in the menu
        </p>

        <p class="pa-3">
          <v-btn color="primary" :loading="isConnecting" @click="tryConnect"
            >Connect</v-btn
          >
          <v-btn
            text="Device not detected?"
            variant="outlined"
            class="text-none ms-2"
            @click="showConnectionHints = true"
          ></v-btn>
        </p>
      </Substep>

      <!-- Identifying model  -->
      <Substep :step="3" :cur="substep" :isLoading="isDetecting">
        <template #title> Identifying model </template>

        <div v-if="modelOptions.length">
          <p>
            Unfortunately we can't detect the exact model. Please select it from
            the list
          </p>
          <p>
            <v-text-field
              label="Search..."
              prepend-inner-icon="mdi-magnify"
              v-model="modelQuery"
              class="model-query"
            ></v-text-field>
            <select
              v-model="codename"
              size="10"
              class="v-field v-field--prepended v-field--variant-filled model-select"
            >
              <option
                v-for="m in modelOptionsFiltered"
                :key="m.codename"
                :value="m.code"
              >
                {{ m.vendor }} {{ m.name }}
                {{ m.models ? `(${m.models.join(", ")})` : "" }}
              </option>
            </select>
          </p>
        </div>

        <div v-if="codename">
          <DeviceInfo
            :codename="codename"
            align="left"
            :isConnected="null"
            :withModels="true"
          />

          <div v-if="unsupportedFeatures === null">
            <v-progress-circular indeterminate></v-progress-circular>
          </div>
          <div v-else-if="unsupportedFeatures.length > 0">
            <v-alert
              type="error"
              title="Device is not supported"
            >
              <template #text>
                <p>
                  This device requires steps which are currently not supported by azadidroid
                </p>
                <p class="my-2">
                  <code>({{ unsupportedFeatures.join(", ") }})</code>
                </p>
                <div class="d-flex align-center">
                  <v-btn :href="githubUnsupportedIssueUrl" variant="outlined" class="mt-2">Report</v-btn>
                  <div class="mt-2 ms-2">(requires an GitHub account)</div>
                </div>
              </template>
            </v-alert>

            <p class="mt-2">
            <v-btn
              text="Back"
              variant="outlined"
              class="text-none"
              @click="substep = 1"
            ></v-btn>
            </p>
          </div>
          <div v-else>
            <div>Is this the correct model?</div>
            <p class="pa-3">
              <v-btn color="primary" @click="accept">Yes</v-btn>
              <v-btn
                text="Back"
                variant="outlined"
                class="text-none ms-2"
                @click="substep = 2"
              ></v-btn>
            </p>
          </div>
        </div>
      </Substep>
    </v-list>

    <div>
      <v-dialog v-model="showConnectionHints" width="auto">
        <v-card>
          <v-card-title>{{ lang.errors.noDevice.message }}</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-list lines="one">
              <v-list-subheader>{{
                lang.errors.noDevice.hintsTitle
              }}</v-list-subheader>
              <v-list-item
                v-for="hint in lang.errors.noDevice.hints"
                :key="hint"
                :title="hint"
              >
                <template v-slot:prepend>
                  <v-icon icon="mdi-check-underline-circle"></v-icon>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-btn
              color="primary"
              variant="elevated"
              :loading="isConnecting"
              @click="tryConnect"
            >
              Try Again
            </v-btn>
            <v-btn
              color="blue-darken-1"
              variant="text"
              @click="showConnectionHints = false"
            >
              Close
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="showClaimErrorHints" width="auto">
        <v-card>
          <v-card-title>{{ lang.errors.deviceInUse.message }}</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-list lines="one">
              <v-list-subheader>{{
                lang.errors.deviceInUse.hintsTitle
              }}</v-list-subheader>
              <v-list-item
                v-for="hint in lang.errors.deviceInUse.hints"
                :key="hint"
                :title="hint"
              >
                <template v-slot:prepend>
                  <v-icon icon="mdi-check-underline-circle"></v-icon>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-btn
              color="blue-darken-1"
              variant="text"
              @click="showClaimErrorHints = false"
            >
              Close
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { DeviceMode } from "azadidroid-lib/src/usb/helpers";
import type USBPhone from "azadidroid-lib/src/usb/USBPhone";
import { logger } from "azadidroid-lib/src/utils/logger";
import { getUnsupportedFeatures, ModelInfos } from "azadidroid-lib/src/models";
import lang from "azadidroid-lib/src/langs/en";
import { onMounted, ref, onBeforeUnmount, computed, watch } from "vue";
import Info from "../../Info.vue";
import Substep from "../Substep.vue";
import { isClaimError } from "azadidroid-lib/src/usb/errors";
import DeviceInfo from "../DeviceInfo.vue";

const props = defineProps<{
  phone: USBPhone;
}>();

const emit = defineEmits(["setCodename"]);

const substep = ref(1);

// connect
const isConnecting = ref(false);
const showConnectionHints = ref(false);

// identifying
const isDetecting = ref(false);
const modelOptions = ref([]);
const showAdbAuthHints = ref(false);
const showClaimErrorHints = ref(false);
const modelQuery = ref("");
const codename = ref("");


let model: ModelInfos|null = null
const unsupportedFeatures = ref<string[] | null>(null);

watch(codename, async (newCodename) => {
  if (!newCodename) {
    unsupportedFeatures.value = null;
    return;
  }
  model = await ModelInfos.get(newCodename);
  unsupportedFeatures.value = getUnsupportedFeatures(model);
});

const githubUnsupportedIssueUrl = computed(() => {
  const url = new URL('https://github.com/alangecker/azadidroid/issues/new')
  url.searchParams.set('title', `add support for ${model.vendor} ${model.name}`)
  url.searchParams.set('body', `Codename: ${codename.value}\n\n### Missing features\n- ${unsupportedFeatures.value.join('\n- ')}`)
  return url.toString()
})


const tryConnect = async () => {
  const { phone } = props;
  if (isConnecting.value) return;
  isConnecting.value = true;
  // reset
  codename.value = "";
  unsupportedFeatures.value = null;
  modelOptions.value = [];
  showConnectionHints.value = false;

  try {
    await phone.requestDevice();
    // identifying step
    substep.value = 3;
    isDetecting.value = true;
    logger.info("before identifying");
    await phone.identifyDevice(async (options) => {
      logger.info("multiple options");
      isDetecting.value = false;
      modelOptions.value = options;
      return "";
    });
    logger.info("indentifying done");
    codename.value = phone.codename;
  } catch (err) {
    logger.info("error");
    logger.error(err);
    // TODO: error claimInterface
    // TODO: adb auth timeout
    if (isClaimError(err)) {
      showClaimErrorHints.value = true;
    }

    substep.value = 2;
  } finally {
    isConnecting.value = false;
    isDetecting.value = false;
  }
};

const modelOptionsFiltered = computed(() => {
  const queryLowercase = modelQuery.value.toLowerCase();
  return modelOptions.value.filter(
    (m) =>
      (m.vendor + " " + m.name).toLowerCase().includes(queryLowercase) ||
      m.models.join(",").toLowerCase().includes(queryLowercase) ||
      m.code.toLowerCase().includes(queryLowercase)
  );
});

const onDisconnect = () => {
  substep.value = 2
};

const onAuthSlow = () => {};

const accept = () => {
  emit("setCodename", codename.value);
};

onMounted(() => {
  props.phone.addEventListener("disconnected", onDisconnect);
  props.phone.addEventListener("authSlow", onAuthSlow);
});
onBeforeUnmount(() => {
  props.phone.removeEventListener("disconnected", onDisconnect);
  props.phone.removeEventListener("authSlow", onAuthSlow);
});
</script>

<style>
.tasklist .v-list-item > * {
  align-self: flex-start;
}
.model-query {
  width: 100%;
}
.model-query .v-input__details {
  display: none;
}
.model-select {
  width: 100%;
}
</style>
