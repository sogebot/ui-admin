<template>
  <v-form v-model="valid">
    <v-checkbox
      v-model="model.enabled"
      :label="translate('registry.alerts.enabled')"
    />

    <v-text-field
      v-model="model.title"
      :placeholder="translate('registry.alerts.title.placeholder')"
      :label="translate('registry.alerts.title.name')"
    />
    {{ model }}
  </v-form>
</template>

<script lang="ts">
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, ref, watch,
} from '@vue/composition-api';

import type { CommonSettingsInterface } from '~/.bot/src/bot/database/entity/alert';

type Props = {
  value: CommonSettingsInterface,
};

export default defineComponent({
  props: { value: Object },
  setup (props: Props, ctx) {
    const valid = ref(true);
    const model = ref(props.value);

    watch(model, (val) => {
      ctx.emit('input', val);
    }, { deep: true });

    return {
      // ref
      valid,
      model,

      // others
      translate,
    };
  },
});
</script>
