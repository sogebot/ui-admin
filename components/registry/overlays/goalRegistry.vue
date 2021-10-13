<template>
  <v-expansion-panels v-model="model">
    <slot />
    <v-expansion-panel :readonly="typeof $slots.default === 'undefined'">
      <v-expansion-panel-header>Settings</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-select
          v-model="options.id"
          :loading="loading"
          :items="itemsOptions"
          label="Goal Registry to use"
        />
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import {
  computed,
  defineComponent, ref, watch,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';
import { useQuery, useResult } from '@vue/apollo-composable';
import {
  defaults, isEqual, pick,
} from 'lodash';

import type { GoalGroupInterface } from '~/.bot/src/database/entity/goal';
import GET_ALL from '~/queries/goals/getAll.gql';

export default defineComponent({
  props: { value: [Object, Array] },
  setup (props: any, ctx) {
    const { result, loading } = useQuery(GET_ALL, null, { pollInterval: 5000 });
    const items = useResult<{ goals: GoalGroupInterface[] }, GoalGroupInterface[], GoalGroupInterface[]>(result, [], data => data.goals);

    const itemsOptions = computed(() => {
      return items.value.map(o => ({
        value: o.id,
        text:  o.id,
      }));
    });

    const model = ref(0);
    const options = ref(
      pick(
        defaults(Array.isArray(props.value) ? null : props.value, { id: '' }),
        ['id'],
      ));

    watch(options, (val: any) => {
      if (!isEqual(props.value, options.value)) {
        ctx.emit('input', val);
      }
    }, { deep: true, immediate: true });

    return {
      model,
      options,
      loading,
      translate,
      itemsOptions,
    };
  },
});
</script>
