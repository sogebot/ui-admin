<template>
  <v-container class="fill-height" fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <iframe :src="url + 'graphql'" width="100%" height="100%" style="border: 0;" />
  </v-container>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';

export default defineComponent({
  setup () {
    const url = computed(() => {
      return (process.env.isNuxtDev ? 'http://localhost:20000/' : '/');
    });

    return {
      url,
      translate,
    };
  },
});
</script>
