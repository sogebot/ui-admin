<template>
  <with-trending
    offline
    type="bigNumber"
    title="followers"
    :timestamp="timestamp"
    :is-stream-online="isStreamOnline"
    :is-loaded="isLoaded"
    :current="current.currentFollowers"
    :average="average.currentFollowers"
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
    isLoaded:       Boolean,
    isStreamOnline: Boolean,
    timestamp:      Number,
    current:        Object,
    average:        Object,
  },
});
</script>
