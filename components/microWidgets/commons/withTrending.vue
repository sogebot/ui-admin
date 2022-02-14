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
            style="font-size: 1rem; height: 32px;"
          >
            <template v-if="!$store.state.areUIStatsHidden || !hide">
              <span
                v-if="type === 'bigNumber'"
                v-html="
                  Intl.NumberFormat($store.state.configuration.lang, {
                    notation: $store.state.configuration.core.ui.shortennumbers ? 'compact' : 'standard',
                    maximumFractionDigits: $store.state.configuration.core.ui.shortennumbers ? 1 : 0,
                  }).formatToParts(isStreamOnline || offline ? currentAnimated.value || 0 : 0).reduce(numberReducer, '')
                "
              />
              <span
                v-else-if="type === 'currency'"
                v-html="
                  Intl.NumberFormat($store.state.configuration.lang, {
                    style: 'currency',
                    currency: $store.state.configuration.currency,
                  }).formatToParts(isStreamOnline || offline ? currentAnimated.value || 0 : 0).reduce(numberReducer, '')
                "
              />
              <span
                v-else-if="type === 'hours'"
                v-html="
                  [
                    ...Intl.NumberFormat($store.state.configuration.lang, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).formatToParts((isStreamOnline || offline ? currentAnimated.value || 0 : 0) / 1000 / 60 / 60),
                    { type:'', value: ' '},
                    { type:'currency', value: 'h'}
                  ].reduce(numberReducer, '')"
              />
              <span v-else>
                {{
                  Intl.NumberFormat($store.state.configuration.lang).format(
                    isStreamOnline
                      ? currentAnimated.value
                      : 0
                  )
                }}
              </span>
              <small
                v-if="$store.state.configuration.core.ui.showdiff && isStreamOnline && currentAnimated.value - averageAnimated.value !== 0"
                class="text-caption"
                :class="{
                  'green--text': isTrending(currentAnimated.value, averageAnimated.value),
                  'red--text': !isTrending(currentAnimated.value, averageAnimated.value),
                }"
              >
                <v-icon
                  :style="{
                    'transform': isTrending(currentAnimated.value, averageAnimated.value) ? '$tY(-7px)' : '$tY(5px)',
                  }"
                  x-small
                  :color="isTrending(currentAnimated.value, averageAnimated.value) ? 'green' : 'red'"
                >{{ isTrending(currentAnimated.value, averageAnimated.value) ? 'mdi-trending-up' : 'mdi-trending-down' }}</v-icon>

                <span
                  class="text-truncate"
                  style="font-size: 0.6rem; position: relative;"
                  :style="{
                    'top': isTrending(currentAnimated.value, averageAnimated.value) ? '-7px' : '6px',
                  }"
                >
                  <span v-if="$store.state.configuration.core.ui.percentage && averageAnimated.value === 0">
                    <v-icon x-small :color="isTrending(currentAnimated.value, averageAnimated.value) ? 'green' : 'red'">mdi-infinity</v-icon>%
                  </span>
                  <span
                    v-else-if="type === 'bigNumber'"
                    v-html="
                      Intl.NumberFormat($store.state.configuration.lang, {
                        style: $store.state.configuration.core.ui.percentage ? 'percent' : 'decimal',
                        notation: $store.state.configuration.core.ui.shortennumbers && !$store.state.configuration.core.ui.percentage ? 'compact' : 'standard',
                        maximumFractionDigits: $store.state.configuration.core.ui.shortennumbers && !$store.state.configuration.core.ui.percentage ? 1 : 0,
                      }).format($store.state.configuration.core.ui.percentage ? Math.abs(currentAnimated.value - averageAnimated.value) / averageAnimated.value : currentAnimated.value - averageAnimated.value)
                    "
                  />
                  <span
                    v-else-if="type === 'currency'"
                    v-html="
                      Intl.NumberFormat($store.state.configuration.lang, {
                        style: $store.state.configuration.core.ui.percentage ? 'percent' : 'currency',
                        currency: $store.state.configuration.currency,
                      }).format($store.state.configuration.core.ui.percentage ? Math.abs(currentAnimated.value - averageAnimated.value) / (averageAnimated.value || 1) : currentAnimated.value - averageAnimated.value)
                    "
                  />
                  <template v-else-if="type === 'hours'">
                    <span
                      v-if="$store.state.configuration.core.ui.percentage"
                      v-html="
                        [
                          ...Intl.NumberFormat($store.state.configuration.lang, {
                            style: 'percent',
                          }).formatToParts(averageAnimated.value / currentAnimated.value),
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
                          }).formatToParts((currentAnimated.value - averageAnimated.value) / 1000 / 60 / 60),
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
                      }).format($store.state.configuration.core.ui.percentage ? Math.abs(currentAnimated.value - averageAnimated.value) / (averageAnimated.value || 1) : currentAnimated.value - averageAnimated.value)
                    "
                  />
                </span>
              </small>
            </template>
            <small v-else class="text-overline">
              {{ $t('hidden') }}
            </small>
          </v-card-title>
          <v-card-subtitle class="pa-1 pt-2 text-caption text-truncate">
            {{ $t(title) }}
          </v-card-subtitle>

          <v-fade-transition v-if="hide">
            <v-overlay
              v-if="hover"
              absolute
              color="#333"
            >
              <v-btn x-small @click="toggleDisplay">
                {{ $t('click-to-toggle-display') }}
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
  defineComponent, ref, useStore, watch,
} from '@nuxtjs/composition-api';
import gsap from 'gsap';

import { isTrending } from '~/functions/isTrending';

export default defineComponent({
  props: {
    isLoaded:       Boolean,
    isStreamOnline: Boolean,
    timestamp:      Number,
    current:        Number,
    average:        Number,
    hide:           Boolean,
    offline:        Boolean,
    title:          String,
    type:           String,
  },
  setup (props) {
    const currentAnimated = ref({
      value: 0,
    });
    const averageAnimated = ref({
      value: 0,
    });
    const store = useStore<any>();

    const numberReducer = (out: string, item: any) => {
      if (['currency', 'compact'].includes(item.type)) {
        out += `<small class="text-muted">${item.value}</small>`;
      } else {
        out += item.value;
      }
      return out;
    };

    watch(() => props.current, (val) => {
      val = val ?? 0;
      gsap.to(currentAnimated.value, {
        duration: 0.5, value: val, roundProps: 'value',
      });
    }, {
      immediate: true,
    });

    watch(() => props.average, (val) => {
      val = val ?? 0;
      gsap.to(averageAnimated.value, {
        duration: 0.5, value: val, roundProps: 'value',
      });
    }, {
      immediate: true,
    });

    const toggleDisplay = () => {
      store.commit('setUIStatsHidden', !store.state.areUIStatsHidden);
    };

    return {
      toggleDisplay, currentAnimated, numberReducer, isTrending, averageAnimated,
    };
  },
});
</script>
