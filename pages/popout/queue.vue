<template>
  <queue />
</template>

<script>
import { defineAsyncComponent, defineComponent } from '@vue/composition-api';

export default defineComponent({
  layout:     'popout',
  components: { queue: defineAsyncComponent({ loader: () => import('~/components/widgets/queue.vue') }) },
});
</script>
