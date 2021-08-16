<template>
  <v-expansion-panels v-model="model">
    <v-expansion-panel readonly>
      <v-expansion-panel-header>Settings</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-select
          v-model="options.order"
          :items="['asc', 'desc']"
          label="Order"
        />
        <v-select
          v-model="options.display"
          multiple
          :items="['username', 'event']"
          label="Display"
        />
        <v-select
          v-model="options.ignore"
          multiple
          :items="['follow', 'raid', 'sub', 'resub', 'rewardredeem', 'cheer', 'tip']"
          label="Omit events"
        />
        <v-text-field
          v-model="options.count"
          label="Count"
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
          display: ['username', 'event'],
          ignore:  [],
          count:   5,
          order:   'desc',
        }),
        ['display', 'ignore', 'count', 'order'],
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
