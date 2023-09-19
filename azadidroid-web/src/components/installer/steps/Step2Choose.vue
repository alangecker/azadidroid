<template>
  <div>
    <p>
      Which <i>Custom ROM</i>
      <Info
        text="A custom ROM is a variant of Android that differs from the official Android supplied by the manufacturer for your device."
      />
      should be installed on your phone?
    </p>
    <p>
      <v-alert v-if="isLoading" variant="outlined" class="mt-3">
        <template #prepend>
          <v-progress-circular indeterminate></v-progress-circular>
        </template>
        <template #text> Searching for available options... </template>
      </v-alert>
      <div v-else>
          <v-alert
            v-if="!roms.length"
            type="error"
            title="No ROM found"
            text="Unfortunately this device seems not supported by any of the known custom ROMs"
            class="mt-3"
          ></v-alert>

        <v-list v-model:selected="selected" select-strategy="single-independent" lines="three">
          <v-list-item v-for="rom in roms" :key="rom.name" :value="rom">
            <template v-slot:prepend="{ isActive }">
              <v-list-item-action start>
                <v-radio
                  :model-value="isActive"
                ></v-radio>
              </v-list-item-action>
            </template>

            <v-list-item-title>
              {{ rom.name }}
            </v-list-item-title>

            <v-list-item-subtitle>
              {{ rom.description }}
            </v-list-item-subtitle>

            <template v-slot:append>
              <div class="text-right text-medium-emphasis">
                <div>{{ rom.build.version }} <span v-if="rom.build.androidVersion">(Android {{ rom.build.androidVersion }})</span></div>
                <div>{{ rom.build.date }}</div>
              </div>
          </template>
          </v-list-item>
        </v-list>

        <v-card-actions>
            <v-btn
              color="primary"
              :variant="!isLoading && !roms.length ? 'elevated' : 'text'"
              @click="$emit('back')"
            >
              Go Back
            </v-btn>
            <v-spacer />
            <v-btn
              v-if="!isLoading && roms.length"
              color="primary"
              variant="elevated"
              :disabled="!selected"
              @click="submit"
            >
              Next
            </v-btn>
          </v-card-actions>
      </div>
    </p>
  </div>
</template>

<script lang="ts" setup>
import Info from "../../Info.vue";
import { onMounted, ref, unref } from "vue";
import { getAvailableRoms } from "azadidroid-lib/src/roms.js";
import { logger } from "azadidroid-lib/src/utils/logger";
import { InstallContext } from "azadidroid-lib/src/steps/base";
import { roms as romsObj } from "azadidroid-data/src/roms";


const props = defineProps<{
  ctx: InstallContext;
}>();
const emit = defineEmits(['back', 'submit'])
const roms = ref([]);
const selected = ref(null);

const isLoading = ref(true);


const nameToRomMapping: any = {}

const load = async () => {
  const res = getAvailableRoms(props.ctx.model.codename);

  const v = await Promise.allSettled(res.map((r) => r.versions));

  let list = [];
  res.forEach((r, index) => {
    nameToRomMapping[r.rom.name] = r.rom
    const res = v[index];
    if (res.status === "rejected") {
      logger.error(res.reason);
    } else {
      if (!res.value.length) return;
      list.push({
        name: r.rom.name,
        link: r.rom.link,
        logo: r.rom.logo,
        description: r.rom.description, // TODO: i18n
        build: res.value[0],
      });
    }
  });

  list = list.sort(
    (a, b) => Date.parse(b.build.date) - Date.parse(a.build.date)
  );
  roms.value = list;

  isLoading.value = false;
};

const submit = () => {
  const s = unref(selected.value[0])
  if(!nameToRomMapping[s?.name]) return
  emit('submit', {
    rom: nameToRomMapping[s.name],
    romBuild: s.build
  })
}

onMounted(load);
</script>

