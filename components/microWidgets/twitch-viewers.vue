<template>
  <v-col
    cols="6"
    lg="2"
    md="4"
    sm="4"
    style="padding: 2px;"
  >
    <v-hover>
      <template #default="{ hover }">
        <v-card
          tile
          min-height="48"
          elevation="5"
          :loading="!isLoaded"
        >
          <v-card-title
            :key="timestamp"
            class="px-1 py-0 text-truncate"
            style="font-size: 1rem;"
          >
            <template v-if="!$store.state.areUIStatsHidden">
              {{
                Intl.NumberFormat($store.state.configuration.lang).format(
                  isStreamOnline
                    ? currentAnimated.value
                    : 0
                )
              }}
            </template>
            <small v-else class="text-overline">
              {{ translate('hidden') }}
            </small>
          </v-card-title>
          <v-card-subtitle class="pa-1 pt-2 text-caption text-truncate">
            {{ translate('viewers') }}
          </v-card-subtitle>

          <v-fade-transition>
            <v-overlay
              v-if="hover"
              absolute
              color="#333"
            >
              <v-btn x-small @click="toggleDisplay">
                {{ translate('click-to-toggle-display') }}
              </v-btn>
            </v-overlay>
          </v-fade-transition>
        </v-card>
      </template>
    </v-hover>
  </v-col>
</template>

<script lang="ts">
import {
  defineComponent, onMounted, ref, useStore,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';
import { gsap } from 'gsap';

export default defineComponent({
  props: {
    isLoaded:       Boolean,
    isStreamOnline: Boolean,
    timestamp:      Number,
    current:        Object,
  },
  setup (props) {
    const currentAnimated = ref({ value: 0 });
    const store = useStore<any>();

    onMounted(() => {
      setInterval(() => {
        gsap.to(currentAnimated.value, {
          duration: 0.5, value: props.current?.currentViewers ?? 0, roundProps: 'value',
        });
      }, 1000);
    });

    const toggleDisplay = () => {
      store.commit('setUIStatsHidden', !store.state.areUIStatsHidden);
    };
    return {
      toggleDisplay, translate, currentAnimated,
    };
  },
});
</script>
