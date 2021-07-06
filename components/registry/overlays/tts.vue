<template>
  <v-expansion-panels>
    <tts v-model="options">
      <template #append>
        <v-switch v-model="options.triggerTTSByHighlightedMessage" dense class="pt-0"
          :label="translate('overlays.texttospeech.settings.triggerTTSByHighlightedMessage')"/>
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

export default defineComponent({
  components: { tts: defineAsyncComponent(() => import('~/components/form/expansion/tts.vue')) },
  props:      { opts: Object },
  setup (props, ctx) {
    const options = ref(props.opts ?? {
      voice:                          'UK English Female',
      volume:                         50,
      rate:                           1,
      pitch:                          1,
      triggerTTSByHighlightedMessage: false,
    });

    watch(options, (val) => {
      ctx.emit('update', val);
    }, { deep: true });

    return {
      options,
      translate,
    };
  },
});
</script>
