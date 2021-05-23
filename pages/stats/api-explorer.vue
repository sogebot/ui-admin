<template>
  <v-container
    fill-height
    fluid
    :class="{ 'pa-4': !$vuetify.breakpoint.mobile }"
  >
    <iframe :src="url + 'frame-api-explorer'" width="100%" height="100%" style="border: 0; filter: invert(0.945) hue-rotate(170deg);" />
  </v-container>
</template>

<script lang="ts">
import translate from '@sogebot/ui-helpers/translate';
import {
  computed,
  defineComponent,
} from '@vue/composition-api';

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
