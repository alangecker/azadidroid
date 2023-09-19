<template>
  <div v-if="confirmCallback">
    <p>
      Please ensure that the last official firmware from {{ ctx.model.vendor }} installed was
      <span v-if="ctx.model.beforeInstallDeviceVariants?.length">the version mentioned below.</span>
      <span v-else><b>Android {{ step.neededVersion }}</b>.</span
      >
    </p>
    <p>
      If {{ ctx.model.vendor }} provided multiple updates for that version, e.g. security updates, make sure you are on the latest!
    </p>

    <table class="table" v-if="ctx.model.beforeInstallDeviceVariants">
      <thead>
        <tr>
          <th>Device model</th>
          <th>Firmware version</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="el of ctx.model.beforeInstallDeviceVariants" :key="el.device">
          <td>{{ el.device }}</td>
          <td>{{ el.firmware }}</td>
        </tr>
      </tbody>
    </table>

    <p class="mt-2" >
       <v-btn color="primary" @click="confirmCallback">Confirm</v-btn>
    </p>
  </div>
  <div v-else></div>
</template>


<script lang="ts" setup>
import type { Step, InstallContext } from "azadidroid-lib/src/steps/base";
import { shallowRef } from "vue";

const props = defineProps<{
  step: Step;
  ctx: InstallContext;
}>();

let confirmCallback = shallowRef(null);


props.step.on("manualConfirm", async () => {
  await new Promise((resolve) => {
    confirmCallback.value = resolve;
  });
});
</script>


