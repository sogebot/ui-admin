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

<script setup lang="ts">
import type { GoalGroupInterface } from '@entity/goal';
import {
  defaults, isEqual, pick,
} from 'lodash';

import GET_ALL from '~/queries/goals/getAll.gql';

const { $graphql } = useNuxtApp();
const props = defineProps({ value: [Object, Array] });

const loading = ref(true);
const items = ref([] as GoalGroupInterface[]);
const refresh = async () => {
  items.value = (await $graphql.default.request(GET_ALL)).goals;
  loading.value = false;
  setTimeout(() => refresh(), 5000);
};

onMounted(() => {
  refresh();
});

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
</script>
