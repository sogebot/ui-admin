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
            <template v-if="!$store.state.areUIStatsHidden || !hide">
              {{
                Intl.NumberFormat($store.state.configuration.lang).format(
                  isStreamOnline
                    ? value
                    : 0
                )
              }}
              <small
                v-if="$store.state.configuration.core.ui.showdiff && isStreamOnline && value - average !== 0"
                class="text-caption"
                :class="{
                  'green--text': isTrending(value, average),
                  'red--text': !isTrending(value, average),
                }"
              >
                <v-icon
                  :style="{
                    'vertical-align': isTrending(value, average) ? 'super' : 'sub',
                  }"
                  x-small
                  :color="isTrending(value, average) ? 'green' : 'red'"
                >{{ isTrending(value, average) ? mdiTrendingUp : mdiTrendingDown }}</v-icon>
                <span
                  :style="{
                    'vertical-align': isTrending(value, average) ? 'super' : 'sub',
                  }"
                  v-html="
                    Intl.NumberFormat($store.state.configuration.lang, {
                      style: $store.state.configuration.core.ui.percentage ? 'percent' : 'decimal'
                    }).format($store.state.configuration.core.ui.percentage ? Math.abs(value - average) / (average || 1) : value - average)
                  "
                />
              </small>
            </template>
            <small v-else class="text-overline">
              {{ translate('hidden') }}
            </small>
          </v-card-title>
          <v-card-subtitle class="pa-1 text-caption">
            {{ translate(title) }}
          </v-card-subtitle>

          <v-fade-transition v-if='hide'>
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
import { mdiTrendingDown, mdiTrendingUp } from '@mdi/js';
import translate from '@sogebot/ui-helpers/translate';
import { defineComponent } from '@vue/composition-api';

import { isTrending } from '~/functions/isTrending';

export default defineComponent({
  props: {
    isLoaded:       Boolean,
    isStreamOnline: Boolean,
    timestamp:      Number,
    value:          Number,
    average:        Number,
    hide:           Boolean,
    title:          String,
  },
  setup (_, ctx) {
    const toggleDisplay = () => {
      ctx.root.$store.commit('setUIStatsHidden', !ctx.root.$store.state.areUIStatsHidden);
    };
    return {
      toggleDisplay, translate, isTrending, mdiTrendingDown, mdiTrendingUp,
    };
  },
});
</script>
