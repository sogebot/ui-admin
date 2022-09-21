<template>
  <div>
    <v-text-field v-model="item.name" filled hide-details="auto" small label="Variable Name" />
    <v-select
      v-model="item.type"
      filled
      hide-details="auto"
      small
      label="Variable Type"
      :items="['string', 'number']"
    />
    <v-textarea
      v-model="item.description"
      auto-grow
      filled
      rows="1"
      row-height="15"
      hide-details="auto"
      small
      label="Variable Description"
    />

    <v-text-field
      v-if="item.type === 'string'"
      v-model="item.defaultValue"
      filled
      hide-details="auto"
      small
      label="Default Value"
      @input="(ev) => item.currentValue = ev"
    />
    <v-text-field
      v-if="item.type === 'number'"
      v-model.number="item.defaultValue"
      type="number"
      filled
      hide-details="auto"
      small
      label="Default Value"
      @input="(ev) => item.currentValue = Number(ev)"
    />
    <v-text-field readonly v-if="editation" label="Variable in messages" :value="`{settings.${item.name}}`" hide-details/>
    <v-text-field readonly v-if="editation" label="Variable in scripts" :value="`settings.${item.name}`" hide-details/>
    <v-btn :color="editation ? 'error' : 'dark'" block class="my-2" @click="() => emit('click')">
      {{ editation ? 'Remove variable' : 'Add new variable' }}
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { Plugin } from '@sogebot/backend/src/database/entity/plugins';

type Props = {
  value: Plugin['settings'][number];
  editation: boolean;
};

const emit = defineEmits(['click', 'update:value']);
const props = defineProps<Props>();

const item = computed({
  get: () => props.value,
  set: value => emit('update:value', value),
});

watch(item.value, (val) => {
  if (val.type === 'number') {
    item.value.currentValue = isNaN(Number(val.currentValue)) ? 0 : Number(val.currentValue);
    item.value.defaultValue = isNaN(Number(val.defaultValue)) ? 0 : Number(val.defaultValue);
  }
  if (val.type === 'string') {
    item.value.currentValue = String(val.currentValue);
    item.value.defaultValue = String(val.defaultValue);
  }
}, { deep: true });
</script>
