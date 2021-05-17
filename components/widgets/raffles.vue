<template>
  <v-card id="5b90af97-ad95-4776-89e3-9a59c67510e5" width="100%" :height="isPopout ? '100%' : undefined">
    <v-toolbar height="36" color="blue-grey darken-4">
      <v-toolbar-title v-if="isPopout" class="text-button">
        {{ translate('widget-title-raffles') }}
      </v-toolbar-title>

      <v-spacer />

      <v-tooltip v-if="!isPopout" bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            icon
            v-bind="attrs"
            href="#/popout/raffles"
            target="_blank"
            v-on="on"
          >
            <v-icon>{{ mdiOpenInNew }}</v-icon>
          </v-btn>
        </template>
        <span>Popout</span>
      </v-tooltip>
    </v-toolbar>

    <v-card-text class="pa-0 ma-0" />
  </v-card>
</template>

<script lang="ts">
import { mdiOpenInNew } from '@mdi/js';
// import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  computed,
  defineComponent, onMounted, ref,
} from '@vue/composition-api';

export default defineComponent({
  setup () {
    const isPopout = computed(() => location.href.includes('popout'));
    const height = ref(600);

    function updateHeight () {
      // so. many. parentElement. to get proper offsetTop as children offset is 0
      const offsetTop = document.getElementById('5b90af97-ad95-4776-89e3-9a59c67510e5')?.parentElement?.parentElement?.parentElement?.parentElement?.offsetTop || 0;
      const offset = 90 + 126;
      const newHeight = window.innerHeight - offsetTop - offset;
      height.value = Math.max(newHeight, 300);
    }

    onMounted(() => {
      setInterval(() => updateHeight(), 100);
    });

    return {
      // refs
      isPopout,
      height,

      // functions

      // helpers
      translate,

      // icons,
      mdiOpenInNew,
    };
  },
});
</script>
