<template>
  <v-col
    cols="6"
    lg="6"
    md="6"
    sm="6"
    class="pa-1"
  >
    <v-skeleton-loader
      v-if="!isLoaded"
      tile
      type="card"
      min-height="60"
      max-height="60"
    />
    <v-card
      v-else
      tile
      min-height="60"
      elevation="5"
    >
      <v-card-title class="pa-1" :key="timestamp">
        {{ song }}
      </v-card-title>
      <v-card-subtitle class="pa-1 text-caption">
        {{ capitalize(translate('currentsong')) }}
      </v-card-subtitle>
    </v-card>
  </v-col>
</template>

<script lang="ts">
import { getTime } from '@sogebot/ui-helpers/getTime';
import { getSocket } from '@sogebot/ui-helpers/socket';
import { defineComponent, onMounted, ref } from '@vue/composition-api';
import translate from '@sogebot/ui-helpers/translate';
import { capitalize } from 'lodash-es';

export default defineComponent({
  props: {
    timestamp: Number,
  },
  setup () {
    const song = ref(null);
    const isLoaded = ref(false);
    onMounted(() => {
      getSocket('/').on('panel::stats', async (data: Record<string, any>) => {
        console.groupCollapsed('panel::stats::song');
        console.log(data.currentSong);
        console.groupEnd();
        song.value = data.currentSong;
        isLoaded.value = true;
      });
    })
    return { getTime, translate, capitalize, song, isLoaded };
  },
});
</script>
