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
        <v-card
          v-for="item of items"
          :key="item.id"
          :color="item.color"
          elevation="2"
          width="100%"
          @click="() => {}"
        >
          <v-card-text class="text-button pa-1 mb-1 text-center" style="font-size: 12px !important;">
            <strong>{{ item.title }}</strong>
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

    const items = ref([{
      id:    '2f1e3ea3-3071-4781-948a-978e7b362ed5',
      title: 'Add 5 to $_test',
      color: 'green',
    }, {
      id:    '2f1e3ea3-3072-4781-948a-978e7b362ed5',
      title: 'Run commercial 30s',
      color: 'deep-orange',
    }, {
      id:    '2f1e3ea3-4072-4781-948a-978e7b362ed5',
      title: 'PUBG Poll',
      color: 'cyan',
    }]);

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
      items,
      mdiCircleEditOutline,
    };
  },
});
</script>
