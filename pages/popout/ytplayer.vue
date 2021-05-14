<template>
  <ytplayer />
</template>

<script>
import { defineAsyncComponent, defineComponent } from '@vue/composition-api';

export default defineComponent({
  layout:     'popout',
  components: { ytplayer: defineAsyncComponent({ loader: () => import('~/components/widgets/ytplayer.vue') }) },
});
</script>
