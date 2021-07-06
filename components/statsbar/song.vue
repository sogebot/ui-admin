<template>
  <v-col
    cols="6"
    lg="2"
    md="4"
    sm="4"
    style="padding: 2px;"
  >
    <v-card
      tile
      min-height="48"
      elevation="5"
      :loading="!isLoaded"
    >
      <v-card-title :key="timestamp" class="px-1 py-0 text-truncate" style="font-size: 1rem;">
        {{ song || capitalize(translate('not-available')) }}
      </v-card-title>
      <v-card-subtitle class="pa-1 pt-2 text-caption text-truncate">
        {{ capitalize(translate('currentsong')) }}
      </v-card-subtitle>
    </v-card>
  </v-col>
</template>

<script lang="ts">
import {
  defineComponent, onMounted, ref,
} from '@nuxtjs/composition-api';
import { getTime } from '@sogebot/ui-helpers/getTime';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { capitalize } from 'lodash';

export default defineComponent({
  props: { timestamp: Number },
  setup () {
    const song = ref(null);
    const isLoaded = ref(false);
    onMounted(() => {
      getSocket('/').on('panel::stats', (data: Record<string, any>) => {
        console.groupCollapsed('panel::stats::song');
        console.log(data.currentSong);
        console.groupEnd();
        song.value = data.currentSong;
        isLoaded.value = true;
      });
    });
    return {
      getTime, translate, capitalize, song, isLoaded,
    };
  },
});
</script>
