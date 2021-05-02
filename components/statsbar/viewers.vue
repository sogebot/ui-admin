<template>
  <v-col
    cols="6"
    lg="2"
    md="4"
    sm="4"
    class="pa-1"
  >
    <v-skeleton-loader
      v-if="!isLoaded"
      tile
      type="card"
      min-height="60"
      max-height="60"
    />
    <v-hover
      v-else
    >
      <template #default="{ hover }">
        <v-card
          tile
          min-height="60"
          elevation="1"
        >
          <v-card-title
            :key="timestamp"
            class="pa-1"
          >
            <template v-if="!$store.state.areUIStatsHidden">
              {{
                Intl.NumberFormat($store.state.configuration.lang).format(
                  isStreamOnline
                    ? viewers
                    : 0
                )
              }}
            </template>
            <small class="text-overline" v-else>
              {{ translate('hidden') }}
            </small>
          </v-card-title>
          <v-card-subtitle class="pa-1 text-caption">
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
import translate from '@sogebot/ui-helpers/translate';
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  props: {
    isLoaded:       Boolean,
    isStreamOnline: Boolean,
    timestamp:      Number,
    viewers:        Number,
  },
  setup (_, ctx) {
    const toggleDisplay = () => {
      ctx.root.$store.commit('setUIStatsHidden', !ctx.root.$store.state.areUIStatsHidden);
    }
    return { toggleDisplay, translate };
  },
});
</script>
