<template>
  <v-expansion-panels v-model="model" multiple>
    <slot />
    <v-expansion-panel>
      <v-expansion-panel-header>Settings</v-expansion-panel-header>
      <v-expansion-panel-content>
        <form-x-time-input
          :value="options.endTime - Date.now()"
          :persistent-hint="true"
          hint="To adjust time, use quickactions button"
          label="Time"
          class="pb-4"
          readonly
          hide-details="auto"
        />

        <v-switch
          v-model="maxEndTimeEnabled"
          label="Enable maximum end time"
          hide-details="auto"
        />
        <v-expand-transition>
          <datetime v-if="options.maxEndTime !== null" v-model="options.maxEndTime" />
        </v-expand-transition>

        <v-switch v-model="options.showProgressGraph" label="Show progress graph" hide-details="auto" />
        <v-switch v-model="options.disableWhenReachedZero" label="Disable when reached zero" hide-details="auto" :persistent-hint="true" :hint="(options.disableWhenReachedZero ? 'Will disable adding new time when reached zero. Will reenable on manual time addition from quickactions.' : 'Time will be added even when reached zero.')" />
        <v-switch v-model="options.showMilliseconds" label="Show milliseconds" hide-details="auto" />
      </v-expansion-panel-content>
    </v-expansion-panel>
    <v-expansion-panel>
      <v-expansion-panel-header>Time addition settings for subs, resubs, bits and tips</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-row>
          <v-col cols="6">
            <v-subheader>Subscriptions</v-subheader>
            <v-text-field v-model="options.values.sub.tier1" hide-details="auto" label="Prime / Tier 1">
              <template #append>
                seconds
              </template>
            </v-text-field>
            <v-text-field v-model="options.values.sub.tier2" hide-details="auto" label="Tier 2">
              <template #append>
                seconds
              </template>
            </v-text-field>
            <v-text-field v-model="options.values.sub.tier3" hide-details="auto" label="Tier 3">
              <template #append>
                seconds
              </template>
            </v-text-field>
            <v-subheader>Tips</v-subheader>
            <v-text-field v-model="options.values.tips.tips" hide-details="auto" label="Amount of donation">
              <template #append>
                {{ currency }}
              </template>
            </v-text-field>
            <v-text-field v-model="options.values.tips.time" hide-details="auto" label="Time">
              <template #append>
                seconds
              </template>
            </v-text-field>
            <v-switch
              v-model="options.values.tips.addFraction"
              label="Add fraction of tip"
              hide-details="auto"
              :persistent-hint="true"
              :hint="(options.values.tips.addFraction ? 'Will add even fractions of amount. E.g. if amount is set to 100 and you got 150, it will add 1.5x of time.' : 'Won\'t add fractions of amount. E.g. if amount is set to 100 and you got 150, it will add 1.0x of time.')"
            />
          </v-col>
          <v-col cols="6">
            <v-subheader>Resubscriptions</v-subheader>
            <v-text-field v-model="options.values.resub.tier1" hide-details="auto" label="Prime / Tier 1">
              <template #append>
                seconds
              </template>
            </v-text-field>
            <v-text-field v-model="options.values.resub.tier2" hide-details="auto" label="Tier 2">
              <template #append>
                seconds
              </template>
            </v-text-field>
            <v-text-field v-model="options.values.resub.tier3" hide-details="auto" label="Tier 3">
              <template #append>
                seconds
              </template>
            </v-text-field>
            <v-subheader>Bits</v-subheader>
            <v-text-field v-model="options.values.bits.bits" hide-details="auto" label="Bits amount" />
            <v-text-field v-model="options.values.bits.time" hide-details="auto" label="Time">
              <template #append>
                seconds
              </template>
            </v-text-field>
            <v-switch
              v-model="options.values.bits.addFraction"
              label="Add fraction of bits"
              hide-details="auto"
              :persistent-hint="true"
              :hint="(options.values.bits.addFraction ? 'Will add even fractions of amount. E.g. if amount is set to 100 and you got 150, it will add 1.5x of time.' : 'Won\'t add fractions of amount. E.g. if amount is set to 100 and you got 150, it will add 1.0x of time.')"
            />
          </v-col>
        </v-row>
      </v-expansion-panel-content>
    </v-expansion-panel>
    <v-expansion-panel>
      <v-expansion-panel-header>Marathon font</v-expansion-panel-header>
      <v-expansion-panel-content>
        <font v-model="options.marathonFont" />
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import {
  computed,
  defineAsyncComponent,
  defineComponent, ref, useStore, watch,
} from '@nuxtjs/composition-api';
import { DAY } from '@sogebot/ui-helpers/constants';
import translate from '@sogebot/ui-helpers/translate';
import { isEqual } from 'lodash';

import { setDefaultOpts } from '~/../backend/src/helpers/overlaysDefaultValues';

export default defineComponent({
  components: {
    font:     defineAsyncComponent(() => import('~/components/form/expansion/font.vue')),
    datetime: defineAsyncComponent({ loader: () => import('~/components/datetime.vue') }),
  },
  props: { value: [Object, Array] },
  setup (props, ctx) {
    const store = useStore<any>();
    const currency = ref(store.state.configuration.currency);
    const model = ref([0]);
    const options = ref(setDefaultOpts(props.value, 'marathon'));

    const maxEndTimeEnabled = computed({
      get () {
        return options.value.maxEndTime !== null;
      },
      set (val: boolean) {
        if (val) {
          options.value.maxEndTime = Date.now() + DAY;
        } else {
          options.value.maxEndTime = null;
        }
      },
    });
    watch(options, (val) => {
      if (!isEqual(props.value, options.value)) {
        ctx.emit('input', val);
      }
    }, { deep: true, immediate: true });

    return {
      model,
      maxEndTimeEnabled,
      options,
      translate,
      currency,
    };
  },
});
</script>
