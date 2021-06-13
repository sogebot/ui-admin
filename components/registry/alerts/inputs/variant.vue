<template>
  <v-select
    v-model="model"
    :items="randomOptions"
    :label="translate('registry.alerts.variant.name')"
  />
</template>

<script lang="ts">
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, ref, watch,
} from '@vue/composition-api';

type Props = {
  value: number;
};

export default defineComponent({
  props: {
    event: String, state: Boolean, condition: String, value: Number,
  },
  setup (props: Props, ctx) {
    const model = ref(props.value);

    watch(model, (val) => {
      ctx.emit('input', val);
    });

    const randomOptions: { value: number, text: string }[] = [
      { value: 0, text: translate('registry.alerts.very-rarely') },
      { value: 1, text: translate('registry.alerts.rarely') },
      { value: 2, text: translate('registry.alerts.default') },
      { value: 3, text: translate('registry.alerts.frequently') },
      { value: 4, text: translate('registry.alerts.very-frequently') },
      { value: 5, text: translate('registry.alerts.exclusive') },
    ];

    return {
      model,
      randomOptions,
      translate,
    };
  },
});
</script>
