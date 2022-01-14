<template>
  <div>
    <v-form ref="form" v-model="valid" lazy-validation>
      <v-select
        v-model="clonedItem.options.marathonId"
        item-value="id"
        :items="overlaysMarathon"
        label="Marathon"
        :rules="rules.marathonId"
        :loading="loading"
      >
        <template #selection="data">
          <template v-if="data.item.groupId">
            <span>{{ data.item.groupId }}</span>
            <v-icon class="px-1">mdi-chevron-right</v-icon>
          </template>
          <strong>{{ data.item.id }}</strong>
        </template>
        <template #item="data">
          <template v-if="data.item.groupId">
            <span>{{ data.item.groupId }}</span>
            <v-icon class="px-1">mdi-chevron-right</v-icon>
          </template>
          <strong>{{ data.item.id }}</strong>
        </template>
      </v-select>
    </v-form>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent, onMounted, onUnmounted, ref, watch,
} from '@nuxtjs/composition-api';
import { useQuery, useResult } from '@vue/apollo-composable';
import { cloneDeep, pick } from 'lodash';

import type {
  OverlayMapperGroup, OverlayMapperMarathon, OverlayMappers,
} from '.bot/src/database/entity/overlay';
import { EventBus } from '~/functions/event-bus';
import { required } from '~/functions/validators';
import GET from '~/queries/overlays/get.gql';

type Props = {
  item: OverlayMappers
};
export default defineComponent({
  props: {
    item: Object,
  },
  setup (props: Props, ctx) {
    const clonedItem = ref(cloneDeep(props.item));
    const valid = ref(true);
    const form = ref(null);

    const overlaysMarathon = computed(() => {
      const marathons: ((OverlayMapperGroup['opts']['items'][number] & {groupId: string}) | OverlayMapperMarathon)[] = overlays.value.filter((o): o is OverlayMapperMarathon => o.value === 'marathon');
      overlays.value.filter((o): o is OverlayMapperGroup => o.value === 'group').forEach((item) => {
        if (item.opts) {
          item.opts.items.filter(o => o.type === 'marathon').forEach(item2 => marathons.push({
            groupId: item.id,
            ...item2,
          }));
        }
      });
      return marathons;
    });
    const { result, refetch, loading } = useQuery(GET);
    const overlays = useResult<{ overlays: Record<string, any> }, (OverlayMapperMarathon | OverlayMapperGroup)[], (OverlayMapperMarathon | OverlayMapperGroup)[]>(result, [], data => [...data.overlays.marathon, ...data.overlays.group]);

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

    const rules = {
      marathonId: [required],
    };

    watch(clonedItem, (val) => {
      ctx.emit('update:item', pick(val, ['id', 'userId', 'order', 'type', 'options.label', 'options.color', 'options.marathonId']));
    }, {
      deep: true,
    });

    watch(valid, (val) => {
      ctx.emit('update:valid', val);
    });

    return {
      clonedItem, rules, valid, form, loading, overlaysMarathon,
    };
  },
});
</script>
