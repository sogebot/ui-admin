<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
      <v-responsive ref="responsive" style="overflow: inherit" :aspect-ratio="16/9" :max-height="height" :max-width="(height / 9) * 16">
    <v-card height="100%" width="100%">
      <v-card-text>
        <item v-for="item of items" :key="item.id" :item="item" :selected.sync="selected" :ratio="ratio" />
      </v-card-text>
    </v-card>
      <v-btn
        fab
        absolute
        right
        bottom
        color="primary"
        dark
        small
        style="z-index: 999"
      >
        <v-icon>{{ mdiPlus }}</v-icon>
      </v-btn>
      </v-responsive>
  </v-container>
</template>

<script lang="ts">
import { mdiPlus } from '@mdi/js';
import {
  defineAsyncComponent, defineComponent, nextTick, onMounted, ref,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import translate from '@sogebot/ui-helpers/translate';

export default defineComponent({
  components: { item: defineAsyncComponent(() => import('~/components/registry/overlays/item.vue')) },
  setup () {
    const selected = ref(null);
    const responsive = ref(null as null | { '$el': HTMLElement });
    const ratio = ref(0);
    const height = ref(1920);

    const resize = (responsiveRef: typeof responsive.value) => {
      if (!responsiveRef) {
        return;
      }
      height.value = window.innerHeight - 100;
      nextTick(() => {
        ratio.value = responsiveRef.$el.clientHeight / 1080;
      });
    };

    onMounted(() => {
      const resizeListener = () => {
        resize(responsive.value);
      };
      window.addEventListener('resize', resizeListener);
      nextTick(() => {
        resize(responsive.value);
      });
    });

    const items = ref([{
      id:     '1',
      type:   'eventlist',
      alignX: 180,
      alignY: 880,
      width:  1600,
      height: 100,
    }, {
      id:     '2',
      type:   'eventlist',
      alignX: 200,
      alignY: 300,
      width:  200,
      height: 200,
    }]);
    return {
      // refs
      translate,
      items,
      selected,
      ButtonStates,
      responsive,
      ratio,
      height,

      // functions

      // icons
      mdiPlus,
    };
  },
});
</script>
