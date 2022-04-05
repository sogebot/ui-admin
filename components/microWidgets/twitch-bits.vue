<template>
  <with-trending
    v-if="broadcasterType !== ''"
    type="bigNumber"
    title="bits"
    :timestamp="timestamp"
    :is-stream-online="isStreamOnline"
    :is-loaded="isLoaded"
    :current="current.currentBits"
    :average="average.currentBits"
  />
  <v-col
    v-else
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
        {{ current || capitalize($t('not-available')) }}
      </v-card-title>
      <v-card-subtitle class="pa-1 pt-2 text-caption text-truncate">
        {{ capitalize($t('bits')) }}
      </v-card-subtitle>
    </v-card>
  </v-col>
</template>

<script lang="ts">
import {
  defineAsyncComponent,
  defineComponent,
} from '@nuxtjs/composition-api';
import { capitalize } from 'lodash'

export default defineComponent({
  components: { withTrending: defineAsyncComponent(() => import('./commons/withTrending.vue')) },
  props:      {
    isLoaded:        Boolean,
    isStreamOnline:  Boolean,
    timestamp:       Number,
    current:         Object,
    average:         Object,
    broadcasterType: String,
  },
  setup() {
    return { capitalize }
  }
});
</script>
