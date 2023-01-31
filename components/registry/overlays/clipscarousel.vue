<template>
  <v-expansion-panels v-model="model">
    <slot />
    <v-expansion-panel :readonly="typeof $slots.default === 'undefined'">
      <v-expansion-panel-header>Settings</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-slider
          v-model.number="options.volume"
          :label="translate('volume')"
          min="0"
          max="100"
          :thumb-size="0"
          thumb-label="always"
        >
          <template #thumb-label="{ value }">
            <div style="transform: translateY(-8px);">
              {{ Number(value) + '%' }}
            </div>
          </template>
        </v-slider>
        <v-text-field
          v-model.number="options.customPeriod"
          :label="translate('overlays.clipscarousel.settings.cClipsCustomPeriodInDays')"
          min="1"
        />
        <v-text-field
          v-model.number="options.numOfClips"
          :label="translate('overlays.clipscarousel.settings.cClipsNumOfClips')"
          min="1"
        />
        <v-select
          v-model="options.animation"
          :items="['fade', 'slide']"
          :label="translate('overlays.emotes.settings.cEmotesAnimation')"
        />
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import {
  defineComponent, ref, watch,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';
import { isEqual } from 'lodash';

import { setDefaultOpts } from '~/../backend/src/helpers/overlaysDefaultValues';

export default defineComponent({
  props: { value: Object },
  setup (props: any, ctx) {
    const model = ref(0);
    const options = ref(setDefaultOpts(props.value!.opts, 'clipscarousel'));

    watch(options, (val: any) => {
      if (val.volume < 0) {
        val.volume = 0;
      }

      if (val.volume > 100) {
        val.volume = 100;
      }

      if (String(val.volume) === '') {
        val.volume = 0;
      }
      if (!isEqual(props.value, { ...props.value, opts: val })) {
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
