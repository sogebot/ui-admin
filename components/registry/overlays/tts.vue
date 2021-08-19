<template>
  <v-expansion-panels v-model="model">
    <tts v-model="options" readonly>
      <template #append>
        <v-switch
          v-model="options.triggerTTSByHighlightedMessage"
          dense
          class="pt-0"
          :label="translate('overlays.texttospeech.settings.triggerTTSByHighlightedMessage')"
        />
      </template>
    </tts>
  </v-expansion-panels>
</template>

<script lang="ts">
import {
  defineAsyncComponent,
  defineComponent, ref, watch,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';
import {
  defaults, isEqual, pick,
} from 'lodash';

export default defineComponent({
  components: { tts: defineAsyncComponent(() => import('~/components/form/expansion/tts.vue')) },
  props:      { value: [Object, Array] },
  setup (props, ctx) {
    const model = ref(0);
    const options = ref(
      pick(
        defaults(Array.isArray(props.value) ? null : props.value, {
          voice:                          'UK English Female',
          volume:                         50,
          rate:                           1,
          pitch:                          1,
          triggerTTSByHighlightedMessage: false,
        }),
        ['voice', 'volume', 'rate', 'pitch', 'triggerTTSByHighlightedMessage'],
      ));

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
