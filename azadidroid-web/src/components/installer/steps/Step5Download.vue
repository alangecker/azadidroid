<template>
  <div>
    <v-alert
      v-if="error"
      variant="outlined"
      density="compact"
      type="error"
      title="Error"
    >
      <template #text>
        <p>{{ error }}</p>
        <v-btn class="ma-3" variant="outlined" @click="retry">Retry</v-btn>
      </template>
    </v-alert>
    <v-alert v-else-if="isListLoading" variant="outlined" class="mt-3">
      <template #prepend>
        <v-progress-circular indeterminate></v-progress-circular>
      </template>
      <template #text>Collect list of files to be downloaded...</template>
    </v-alert>
    <v-list v-else>
      <v-list-subheader>Downloading files</v-list-subheader>
      <v-list-item
        v-for="file in filesToDownload"
        :key="file.req.key"
        :title="file.req.title"
        :subtitle="file.req.fileName"
      >
        <template #prepend>
          <div class="side">
            <v-progress-circular
              v-if="file.isLoading"
              indeterminate
              :size="18"
              :width="2"
            ></v-progress-circular>
            <v-icon v-else icon="mdi-check-bold"></v-icon>
          </div>
        </template>
        <template #append>
          <div v-if="!file.isLoading"></div>
          <div
            v-else-if="!file.size || file.percentage === 100"
            style="min-width: 150px"
          >
            <div><v-progress-linear indeterminate></v-progress-linear></div>
            <div v-if="file.percentage === 100">verifying...</div>
          </div>
          <div v-else style="min-width: 150px">
            <div>
              <v-progress-linear
                :model-value="file.percentage"
              ></v-progress-linear>
            </div>
            <div v-if="file.size">
              {{ file.percentage }}% of {{ formatBytes(file.size) }}
            </div>
          </div>
        </template>
      </v-list-item>
    </v-list>

    <v-card-actions>
      <v-btn color="primary" variant="text" @click="back"> Go Back </v-btn>
    </v-card-actions>
  </div>
</template>


<script lang="ts" setup>
import {
  IDownloadRequest,
  InstallContext,
  Step,
} from "azadidroid-lib/src/steps/base";
import { logger } from "azadidroid-lib/src/utils/logger";
import { download } from "azadidroid-lib/src/utils/download";

import { onMounted, ref } from "vue";
import { FileStore } from "../../../store/files";

const props = defineProps<{
  steps: {[key: string]: Step[]};
  ctx: InstallContext;
  fileStore: FileStore;
}>();
const emit = defineEmits(["back", "next"]);
let abort = new AbortController()

const back = () => {
  abort.abort('user is going back')
  emit('back')
}

const isListLoading = ref(true);
const error = ref(null);
const filesToDownload = ref(
  [] as Array<{
    req: IDownloadRequest;
    percentage: number;
    size: number;
    isLoading: boolean;
  }>
);

const MB = 1024 * 1024;
const GB = MB * 1024;
const formatBytes = (bytes: number) => {
  if (bytes > GB) return (bytes / GB).toFixed(1) + " GB";
  else return Math.round(bytes / MB) + "MB";
};

const startDownload = async () => {
  try {
    for (let section in props.steps) {
      for (let step of props.steps[section]) {
        const files = await step.getFilesToDownload(props.ctx);
        for (let file of files) {
          filesToDownload.value.push({
            req: file,
            percentage: 0,
            size: 0,
            isLoading: true,
          });
        }
      }
    }
    isListLoading.value = false;

    let promises: Promise<any>[] = []
    for (let file of filesToDownload.value) {
      promises.push(download(file.req, props.fileStore, (e) => {
        file.size = e.total;
        file.percentage = Math.round(e.progress * 100);
      }, abort.signal).then((data) => {
        file.isLoading = false;

        // eslint-disable-next-line vue/no-mutating-props
        props.ctx.files[file.req.key] = data
      }));
    }
    await Promise.all(promises)
    emit('next')
  } catch (err) {
    logger.error(err);
    abort.abort(err)
    error.value = err.message;
  }
};
const retry = () => {
  // eslint-disable-next-line vue/no-mutating-props
  filesToDownload.value = []
  isListLoading.value = true
  error.value = null;
  abort = new AbortController()
  startDownload();
};

onMounted(startDownload)
</script>

<style scoped>
.side {
  width: 3em;
}
</style>
