<template>
  <with-trending
    hide
    title="new-chatters"
    :timestamp="timestamp"
    :is-stream-online="isStreamOnline"
    :is-loaded="isLoaded"
    :current="current.newChatters"
    :average="average.newChatters"
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
