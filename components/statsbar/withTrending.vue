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
          elevation="5"
        >
          <v-card-title
            :key="timestamp"
            class="pa-1"
          >
            <template v-if="!$store.state.areUIStatsHidden || !hide">
              <span
                v-if="type === 'bigNumber'"
                v-html="
                  Intl.NumberFormat($store.state.configuration.lang, {
                    notation: $store.state.configuration.core.ui.shortennumbers ? 'compact' : 'standard',
                    maximumFractionDigits: $store.state.configuration.core.ui.shortennumbers ? 1 : 0,
                  }).formatToParts(isStreamOnline ? current : 0).reduce(numberReducer, '')
                "
              />
              <span
                v-else-if="type === 'currency'"
                v-html="
                  Intl.NumberFormat($store.state.configuration.lang, {
                    style: 'currency',
                    currency: $store.state.configuration.currency,
                  }).formatToParts(isStreamOnline ? current : 0).reduce(numberReducer, '')
                "
              />
              <span
                v-else-if="type === 'hours'"
                v-html="
                  [
                    ...Intl.NumberFormat($store.state.configuration.lang, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).formatToParts((isStreamOnline ? current : 0) / 1000 / 60 / 60),
                    { type:'', value: ' '},
                    { type:'currency', value: 'h'}
                  ].reduce(numberReducer, '')"
              />
              <span v-else>
                {{
                  Intl.NumberFormat($store.state.configuration.lang).format(
                    isStreamOnline
                      ? current
                      : 0
                  )
                }}
              </span>
              <small
                v-if="$store.state.configuration.core.ui.showdiff && isStreamOnline && current - average !== 0"
                class="text-caption"
                :class="{
                  'green--text': isTrending(current, average),
                  'red--text': !isTrending(current, average),
                }"
              >
                <v-icon
                  :style="{
                    'vertical-align': isTrending(current, average) ? 'super' : 'sub',
                  }"
                  x-small
                  :color="isTrending(current, average) ? 'green' : 'red'"
                >{{ isTrending(current, average) ? mdiTrendingUp : mdiTrendingDown }}</v-icon>

                <span
                  :style="{
                    'vertical-align': isTrending(current, average) ? 'super' : 'sub',
                  }"
                >
                  <span v-if="$store.state.configuration.core.ui.percentage && average === 0">
                    <v-icon x-small :color="isTrending(current, average) ? 'green' : 'red'">{{ mdiInfinity }}</v-icon>%
                  </span>
                  <span
                    v-else-if="type === 'bigNumber'"
                    v-html="
                      Intl.NumberFormat($store.state.configuration.lang, {
                        style: $store.state.configuration.core.ui.percentage ? 'percent' : 'decimal',
                        notation: $store.state.configuration.core.ui.shortennumbers && !$store.state.configuration.core.ui.percentage ? 'compact' : 'standard',
                        maximumFractionDigits: $store.state.configuration.core.ui.shortennumbers && !$store.state.configuration.core.ui.percentage ? 1 : 0,
                      }).format($store.state.configuration.core.ui.percentage ? Math.abs(current - average) / average : current - average)
                    "
                  />
                  <span
                    v-else-if="type === 'currency'"
                    v-html="
                      Intl.NumberFormat($store.state.configuration.lang, {
                        style: $store.state.configuration.core.ui.percentage ? 'percent' : 'currency',
                        currency: $store.state.configuration.currency,
                      }).format($store.state.configuration.core.ui.percentage ? Math.abs(current - average) / (average || 1) : current - average)
                    "
                  />
                  <template v-else-if="type === 'hours'">
                    <span
                      v-if="$store.state.configuration.core.ui.percentage"
                      v-html="
                        [
                          ...Intl.NumberFormat($store.state.configuration.lang, {
                            style: 'percent',
                          }).formatToParts(average / current),
                        ].reduce(numberReducer, '')
                      "
                    />
                    <span
                      v-else
                      v-html="
                        [
                          ...Intl.NumberFormat($store.state.configuration.lang, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).formatToParts((current - average) / 1000 / 60 / 60),
                          { type:'', value: ' '},
                          { type:'', value: 'h'}
                        ].reduce(numberReducer, '')
                      "
                    />
                  </template>
                  <span
                    v-else
                    v-html="
                      Intl.NumberFormat($store.state.configuration.lang, {
                        style: $store.state.configuration.core.ui.percentage ? 'percent' : 'decimal'
                      }).format($store.state.configuration.core.ui.percentage ? Math.abs(current - average) / (average || 1) : current - average)
                    "
                  />
                </span>
              </small>
            </template>
            <small v-else class="text-overline">
              {{ translate('hidden') }}
            </small>
          </v-card-title>
          <v-card-subtitle class="pa-1 text-caption">
            {{ translate(title) }}
          </v-card-subtitle>

          <v-fade-transition v-if="hide">
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
  mdiInfinity, mdiTrendingDown, mdiTrendingUp,
} from '@mdi/js';
import translate from '@sogebot/ui-helpers/translate';
import { defineComponent } from '@vue/composition-api';

import { isTrending } from '~/functions/isTrending';

export default defineComponent({
  props: {
    isLoaded:       Boolean,
    isStreamOnline: Boolean,
    timestamp:      Number,
    current:        Number,
    average:        Number,
    hide:           Boolean,
    title:          String,
    type:           String,
  },
  setup (_, ctx) {
    const numberReducer = (out: string, item: any) => {
      if (['currency', 'compact'].includes(item.type)) {
        out += `<small class="text-muted">${item.value}</small>`;
      } else {
        out += item.value;
      }
      return out;
    };

    const toggleDisplay = () => {
      ctx.root.$store.commit('setUIStatsHidden', !ctx.root.$store.state.areUIStatsHidden);
    };

    return {
      toggleDisplay, numberReducer, translate, isTrending, mdiTrendingDown, mdiTrendingUp, mdiInfinity,
    };
  },
});
</script>
