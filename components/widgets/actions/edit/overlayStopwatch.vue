<template>
  <div>
    <v-form ref="form" v-model="valid" lazy-validation>
      <v-select
        v-model="clonedItem.options.stopwatchId"
        item-value="id"
        :items="overlays"
        label="Stopwatch"
        :rules="rules.stopwatchId"
        :loading="loading"
      >
        <template #selection="data">
          <template v-if="data.item.groupId">
            <span>{{ data.item.groupId }}</span>
            <v-icon class="px-1">
              mdi-chevron-right
            </v-icon>
          </template>
          <strong>{{ data.item.id }}</strong>
        </template>
        <template #item="data">
          <template v-if="data.item.groupId">
            <span>{{ data.item.groupId }}</span>
            <v-icon class="px-1">
              mdi-chevron-right
            </v-icon>
          </template>
          <strong>{{ data.item.id }}</strong>
        </template>
      </v-select>
    </v-form>
  </div>
</template>

<script lang="ts">
import type {
  OverlayMappers, OverlayMapperStopwatch,
} from '@entity/overlay';
import {
  defineComponent, onMounted, onUnmounted, ref, watch,
} from '@nuxtjs/composition-api';
import { useQuery, useResult } from '@vue/apollo-composable';
import { cloneDeep, pick } from 'lodash';

import { EventBus } from '~/functions/event-bus';
import { required } from '~/functions/validators';
import GET from '~/queries/overlays/get.gql';

type Props = {
  item: OverlayMappers
};
export default defineComponent({
  props: { item: Object },
  setup (props: Props, ctx) {
    const clonedItem = ref(cloneDeep(props.item));
    const valid = ref(true);
    const form = ref(null);

    const { result, refetch, loading } = useQuery(GET, { allowGroups: true });
    const overlays = useResult<{ overlays: Record<string, any> }, OverlayMapperStopwatch[], OverlayMapperStopwatch[]>(result, [], data => [...data.overlays.stopwatch]);

    onMounted(() => {
      refetch();

      EventBus.$on(`quickaction::${props.item.id}::valid`, () => {
        console.debug(`quickaction::${props.item.id}::valid`);
        (form.value as unknown as HTMLFormElement).validate();
      });
    });

    onUnmounted(() => {
      EventBus.$off(`quickaction::${props.item.id}::valid`);
    });

    const rules = { stopwatchId: [required] };

    watch(clonedItem, (val) => {
      ctx.emit('update:item', pick(val, ['id', 'userId', 'order', 'type', 'options.label', 'options.color', 'options.stopwatchId']));
    }, { deep: true });

    watch(valid, (val) => {
      ctx.emit('update:valid', val);
    });

    return {
      clonedItem, rules, valid, form, loading, overlays,
    };
  },
});
</script>
