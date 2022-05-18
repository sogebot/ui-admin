<template>
  <v-expansion-panels v-model="model" multiple>
    <slot />
    <v-expansion-panel :readonly="typeof $slots.default === 'undefined'">
      <v-expansion-panel-header>Settings</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-text-field v-model="options.fadeOutInterval" label="Fade out interval" min="1" hide-details="auto">
          <template #append-outer>
            <v-select v-model="options.fadeOutIntervalType" dense hide-details="auto" solo :items="[ 'seconds', 'minutes', 'hours' ]" />
          </template>
        </v-text-field>
      </v-expansion-panel-content>
    </v-expansion-panel>
    <v-expansion-panel>
      <v-expansion-panel-header>Word font</v-expansion-panel-header>
      <v-expansion-panel-content>
        <font v-model="options.wordFont" />
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
import {
  defaultsDeep, isEqual, pick,
} from 'lodash';

export default defineComponent({
  components: { font: defineAsyncComponent(() => import('~/components/form/expansion/font.vue')) },
  props:      { value: [Object, Array] },
  setup (props, ctx) {
    const model = ref([0]);
    const options = ref(props.value);

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
