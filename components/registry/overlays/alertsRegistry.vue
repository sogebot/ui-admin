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
          label="Alert Registry to use"
        />
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup lang="ts">
import type { Alert } from '@entity/alert';
import axios from 'axios';
import { isEqual } from 'lodash';

import { setDefaultOpts } from '~/../backend/src/helpers/overlaysDefaultValues';

const props = defineProps({ value: [Object, Array] });
const emit = defineEmits(['input']);

const loading = ref(true);
const items = ref([] as Alert[]);
const refresh = async () => {
  const res = await axios.get(`/api/registries/alerts`, { headers: { authorization: `Bearer ${localStorage.accessToken}` } });
  items.value = res.data;
  loading.value = false;
  setTimeout(() => refresh(), 5000);
};

const itemsOptions = computed(() => {
  return items.value.map(o => ({
    value: o.id,
    text:  o.name,
  }));
});

onMounted(() => {
  refresh();
});

const model = ref(0);
const options = ref(setDefaultOpts(props.value!.opts, 'alertsRegistry'));

watch(options, (val: any) => {
  if (!isEqual(props.value, { ...props.value, opts: val })) {
    emit('input', val);
  }
}, { deep: true, immediate: true });
</script>
