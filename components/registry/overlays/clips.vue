<template>
  <v-expansion-panels v-model="model">
    <v-expansion-panel readonly>
      <v-expansion-panel-header>Settings</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-text-field
          v-model.number="options.volume"
          :label="translate('volume')"
          min="0"
          max="100"
        />
        <v-select
          v-model="options.filter"
          :items="['none', 'grayscale', 'sepia', 'tint', 'washed']"
          :label="translate('overlays.clips.settings.cClipsFilter')"
        />
        <v-switch
          v-model="options.showLabel"
          :label="translate('overlays.clips.settings.cClipsLabel')"
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
import {
  defaults, isEqual, pick,
} from 'lodash';

export default defineComponent({
  props: { value: [Object, Array] },
  setup (props: any, ctx) {
    const model = ref(0);
    const options = ref(
      pick(
        defaults(Array.isArray(props.value) ? null : props.value, {
          volume:    0,
          filter:    'none',
          showLabel: true,
        }),
        ['volume', 'filter', 'showLabel'],
      ));

    watch(options, (val: any) => {
      if (val.volume < 0) {
        val.volume = 0;
      }

      if (val.volume > 100) {
        val.volume = 100;
      }

      if (String(val.volume) === '') {
        val.volume = 0;
      } if (!isEqual(props.value, options.value)) {
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
