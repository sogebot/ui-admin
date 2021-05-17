<template>
  <raffles />
</template>

<script>
import { defineAsyncComponent, defineComponent } from '@vue/composition-api';

export default defineComponent({
  layout:     'popout',
  components: { raffles: defineAsyncComponent({ loader: () => import('~/components/widgets/raffles.vue') }) },
});
</script>
