<template>
  <div>
    <v-form ref="form" v-model="valid" lazy-validation>
      <v-select
        v-model="clonedItem.options.marathonId"
        item-value="id"
        :items="overlays"
        label="Marathon"
        :rules="rules.marathonId"
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
import type { OverlayMapperMarathon, OverlayMappers } from '@entity/overlay';
import { cloneDeep, pick } from 'lodash';

import { EventBus } from '~/functions/event-bus';
import { required } from '~/functions/validators';
import GET from '~/queries/overlays/get.gql';

const { $graphql } = useNuxtApp();
const props = defineProps<{
  item: OverlayMappers
}>();
const emit = defineEmits(['update:item', 'update:valid']);
const clonedItem = ref(cloneDeep(props.item));
const valid = ref(true);
const form = ref(null);

const loading = ref(true);
const overlays = ref([] as OverlayMapperMarathon[]);
const refetch = async () => {
  overlays.value = [...(await $graphql.default.request(GET, { allowGroups: true })).overlays.marathon];
  loading.value = false;
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

const rules = { marathonId: [required] };

watch(clonedItem, (val) => {
  emit('update:item', pick(val, ['id', 'userId', 'order', 'type', 'options.label', 'options.color', 'options.marathonId']));
}, { deep: true });

watch(valid, (val) => {
  emit('update:valid', val);
});
</script>
