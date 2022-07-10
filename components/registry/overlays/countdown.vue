<template>
  <v-expansion-panels v-model="model" multiple>
    <slot />
    <v-expansion-panel>
      <v-expansion-panel-header>Settings</v-expansion-panel-header>
      <v-expansion-panel-content>
        <form-x-time-input v-model.lazy="options.currentTime" label="Countdown" hide-details="auto" />

        <v-switch v-model="options.isPersistent" label="Persistent" :persistent-hint="true" :hint="(options.isPersistent ? 'Countdown will keep value on browser source load, you will need to reset by dashboard\'s action button.' : 'Countdown will reset on browser source load.')" />
        <v-switch v-model="options.isStartedOnSourceLoad" label="Start automatically" :persistent-hint="true" :hint="(options.isStartedOnSourceLoad ? 'Countdown will start automatically on browser source load.' : 'Countdown won\'t start on browser source load, you will need to start it by dashboard\'s action button.')" />
        <v-switch v-model="options.showMilliseconds" label="Show milliseconds" />

        <v-row align="center" class="pa-2 pt-4">
          <v-simple-checkbox v-model="options.showMessageWhenReachedZero" class="shrink" />
          <v-text-field v-model="options.messageWhenReachedZero" label="Message to show, when countdown reaches zero" :disabled="!options.showMessageWhenReachedZero" />
        </v-row>
      </v-expansion-panel-content>
    </v-expansion-panel>
    <v-expansion-panel>
      <v-expansion-panel-header>Countdown font</v-expansion-panel-header>
      <v-expansion-panel-content>
        <font v-model="options.countdownFont" />
      </v-expansion-panel-content>
    </v-expansion-panel>
    <v-expansion-panel>
      <v-expansion-panel-header>Message font</v-expansion-panel-header>
      <v-expansion-panel-content>
        <font v-model="options.messageFont" />
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import {
  defineAsyncComponent,
  defineComponent, ref, watch,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';
import { isEqual } from 'lodash';

import { setDefaultOpts } from '~/../backend/src/helpers/overlaysDefaultValues';

export default defineComponent({
  components: { font: defineAsyncComponent(() => import('~/components/form/expansion/font.vue')) },
  props:      { value: [Object, Array] },
  setup (props, ctx) {
    const model = ref([0]);
    const options = ref(setDefaultOpts(props.value, 'countdown'));

    watch(() => options.value.time, (val) => {
      if (val < 0) {
        options.value.time = 0;
      }
      options.value.currentTime = options.value.time;
    });

    watch(options, (val) => {
      if (!isEqual(props.value, options.value)) {
        ctx.emit('input', val);
      }
    }, { deep: true, immediate: true });

    return {
      model,
      options,
      translate,
    };
  },
});
</script>
