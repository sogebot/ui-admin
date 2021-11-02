<template>
  <with-trending
    offline
    v-if="broadcasterType !== ''"
    type="bigNumber"
    title="subscribers"
    :timestamp="timestamp"
    :is-stream-online="isStreamOnline"
    :is-loaded="isLoaded"
    :current="current.currentSubscribers"
    :average="average.currentSubscribers"
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
