<template>
  <actions />
</template>

<script>
import { defineAsyncComponent, defineComponent } from '@nuxtjs/composition-api';

export default defineComponent({
  layout:     'popout',
  components: { actions: defineAsyncComponent({ loader: () => import('~/components/widgets/actions.vue') }) },
});
</script>
