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

<script setup lang="ts">
import type { OverlayMappers, OverlayMapperStopwatch } from '@entity/overlay';
import { getSocket } from '@sogebot/ui-helpers/socket';
import { cloneDeep, pick } from 'lodash';
import { error } from '~/functions/error';

import { EventBus } from '~/functions/event-bus';
import { required } from '~/functions/validators';

const props = defineProps<{
  item: OverlayMappers
}>();
const emit = defineEmits(['update:item', 'update:valid']);
const clonedItem = ref(cloneDeep(props.item));
const valid = ref(true);
const form = ref(null);

const loading = ref(true);
const overlays = ref([] as OverlayMapperStopwatch[]);

const refetch = () => {
  getSocket('/registries/overlays').emit('generic::getAll', (err, result) => {
    if (err) {
      return error(err);
    }
    overlays.value = result.filter(o => o.value === 'stopwatch') as any ?? null;
    loading.value = false;
  });
};

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
  emit('update:item', pick(val, ['id', 'userId', 'order', 'type', 'options.label', 'options.color', 'options.stopwatchId']));
}, { deep: true });

watch(valid, (val) => {
  emit('update:valid', val);
});
</script>
