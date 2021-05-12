<template>
  <v-card id="c7eff6a7-dc62-4c0b-bad6-90df9d5b605f" :key="timestamp" width="100%" height="100%">
    <v-toolbar color="blue-grey darken-4" class="mb-1" height="36">
      <v-toolbar-title class="text-button">
        Actions
      </v-toolbar-title>
      <v-spacer />
      <v-btn icon>
        <v-icon>{{ mdiCircleEditOutline }}</v-icon>
      </v-btn>
    </v-toolbar>

    <v-row dense>
      <v-col cols="12">
        <v-card color="primary" elevation="2" width="100%" @click="() => {}">
          <v-card-text class="text-caption pa-1 ma-0 text-center">
            <strong>Add 5 to $_test</strong>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-card>
</template>

<script lang="ts">
import { mdiCircleEditOutline } from '@mdi/js';
import {
  defineComponent, onMounted, ref,
} from '@vue/composition-api';

export default defineComponent({
  setup () {
    const dialog = ref(false);
    const height = ref(600);

    function updateHeight () {
      // so. many. parentElement. to get proper offsetTop as children offset is 0
      const offsetTop = document.getElementById('c7eff6a7-dc62-4c0b-bad6-90df9d5b605f')?.parentElement?.parentElement?.parentElement?.parentElement?.offsetTop || 0;
      const offset = 85;
      const newHeight = window.innerHeight - offsetTop - offset;
      height.value = Math.max(newHeight, 500);
    }

    onMounted(() => {
      setInterval(() => updateHeight(), 1000);
    });

    return {
      dialog,
      height,
      mdiCircleEditOutline,
    };
  },
});
</script>
