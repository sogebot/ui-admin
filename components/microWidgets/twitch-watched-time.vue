<template>
  <with-trending
    type="hours"
    title="watched-time"
    :timestamp="timestamp"
    :is-stream-online="isStreamOnline"
    :is-loaded="isLoaded"
    :current="current.currentWatched"
    :average="average.currentWatched"
  />
</template>

<script lang="ts">
import {
  defineAsyncComponent,
  defineComponent,
} from '@nuxtjs/composition-api';

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
});
</script>
