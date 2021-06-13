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

    <query-filter v-model="model.filter" :rules="[['username', 'string']]" />
    <variant v-model="model.variantAmount" />

    <v-text-field
      v-model="model.messageTemplate"
      :placeholder="translate('registry.alerts.messageTemplate.placeholder')"
      :label="translate('registry.alerts.messageTemplate.name')"
      :hint="translate('registry.alerts.messageTemplate.help')"
      persistent-hint
    />

    <v-expansion-panels>
      <text-animation
        :animation.sync="model.animationText"
        :animation-options.sync="model.animationTextOptions"
      />
    </v-expansion-panels>
    {{ model }}
  </v-form>
</template>

<script lang="ts">
import translate from '@sogebot/ui-helpers/translate';
import {
  defineAsyncComponent,
  defineComponent, ref, watch,
} from '@vue/composition-api';

import type { CommonSettingsInterface } from '~/.bot/src/bot/database/entity/alert';

type Props = {
  value: CommonSettingsInterface,
};

export default defineComponent({
  components: {
    queryFilter:   defineAsyncComponent(() => import('~/components/registry/alerts/inputs/query-filter.vue')),
    variant:       defineAsyncComponent(() => import('~/components/registry/alerts/inputs/variant.vue')),
    textAnimation: defineAsyncComponent(() => import('~/components/registry/alerts/inputs/text-animation.vue')),
  },
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
