<template>
  <v-container class="fill-height" fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <iframe :src="url + 'frame-api-explorer'" width="100%" height="100%" style="border: 0; filter: invert(0.945) hue-rotate(170deg);" />
  </v-container>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  useStore,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';

export default defineComponent({
  setup () {
    const store = useStore();
    const url = computed(() => {
      return (process.env.isNuxtDev ? 'http://localhost:20000/' : '/');
    });

    onMounted(() => {
      store.commit('panel/breadcrumbs', [
        { text: translate('menu.stats') },
        { text: translate('menu.api-explorer') },
      ]);
    });

    return {
      url,
      translate,
    };
  },
});
</script>
