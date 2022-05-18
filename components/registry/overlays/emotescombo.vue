<template>
  <v-expansion-panels v-model="model">
    <slot/>
    <v-expansion-panel :readonly="typeof $slots.default === 'undefined'">
      <v-expansion-panel-header>Settings</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-text-field
          v-model.number="options.showEmoteInOverlayThreshold"
          :label="translate('overlays.emotes.settings.showEmoteInOverlayThreshold')"
          min="1"
        />
        <v-text-field
          v-model.number="options.hideEmoteInOverlayAfter"
          :label="translate('overlays.emotes.settings.hideEmoteInOverlayAfter.title')"
          :hint="translate('overlays.emotes.settings.hideEmoteInOverlayAfter.help')"
          persistent-hint
          min="1"
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
    const options = ref(props.value);

    watch(options, (val: any) => {
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
