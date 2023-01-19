<template>
  <div>
    <v-form ref="form" v-model="valid" lazy-validation>
      <v-select
        v-model="clonedItem.options.randomizerId"
        item-value="id"
        :items="randomizers"
        label="Randomizer"
        :rules="rules.randomizerId"
        :loading="loading"
      >
        <template #selection="data">
          <strong>{{ data.item.name }}</strong>
          <small class="pl-1 font-italic">{{ data.item.id }}</small>
        </template>
        <template #item="data">
          <strong>{{ data.item.name }}</strong>
          <small class="pl-1 font-italic">{{ data.item.id }}</small>
        </template>
      </v-select>
    </v-form>
  </div>
</template>

<script setup lang="ts">
import type { RandomizerItem } from '@entity/dashboard';
import { Randomizer } from '@entity/randomizer';
import axios from 'axios';
import { cloneDeep, pick } from 'lodash';

import { EventBus } from '~/functions/event-bus';
import { required } from '~/functions/validators';

const props = defineProps<{
  item: RandomizerItem
}>();
const emit = defineEmits(['update:item', 'update:valid']);

const loading = ref(true);
const randomizers = ref([] as Randomizer[]);
const refetch = async () => {
  const res = await axios.get('/api/registries/randomizer/', { headers: { authorization: `Bearer ${localStorage.accessToken}` } });
  randomizers.value = res.data;
  loading.value = false;
};

const clonedItem = ref(cloneDeep(props.item));
const valid = ref(true);
const form = ref(null);

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

const rules = { randomizerId: [required] };

watch(clonedItem, (val) => {
  emit('update:item', pick(val, ['id', 'userId', 'order', 'type', 'options.label', 'options.color', 'options.randomizerId']));
}, { deep: true });

watch(valid, (val) => {
  emit('update:valid', val);
});
</script>
