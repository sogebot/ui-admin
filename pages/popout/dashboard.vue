<template>
  <dashboard />
</template>

<script>
import { defineAsyncComponent, defineComponent } from '@vue/composition-api';

export default defineComponent({
  layout:     'popout',
  components: { dashboard: defineAsyncComponent({ loader: () => import('~/components/widgets.vue') }) },
});
</script>
