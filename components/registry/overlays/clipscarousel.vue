<template>
  <v-text-field
    v-model.number="options.volume"
    :label="translate('volume')"
    min="0"
    max="100"
  />
</template>

<script lang="ts">
import {
  defineComponent, ref, watch,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';

const prepareOpts = (data: any) => {
  if (!data || data.volume === null || typeof data.volume === 'undefined') {
    return { volume: 0 };
  } else {
    return { volume: data.volume as number };
  }
};

export default defineComponent({
  props: { opts: Object },
  setup (props: any, ctx) {
    const options = ref(prepareOpts(props.opts));

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

      ctx.emit('update', val);
    }, { deep: true });

    return {
      options,
      translate,
    };
  },
});
</script>
