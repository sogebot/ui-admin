<template>
  <events />
</template>

<script>
import { defineAsyncComponent, defineComponent } from '@vue/composition-api';

export default defineComponent({
  layout:     'popout',
  components: { events: defineAsyncComponent({ loader: () => import('~/components/widgets/events.vue') }) },
});
</script>
