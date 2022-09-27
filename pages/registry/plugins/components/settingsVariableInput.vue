<template>
  <v-card>
    <v-card-text>
      <v-text-field v-model="item.name" filled hide-details="auto" small label="Variable Name" />
      <v-select
        v-model="item.type"
        filled
        hide-details="auto"
        small
        label="Variable Type"
        :items="['string', 'number', 'array']"
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

      <template v-if="item.type === 'array'">
        <v-banner single-line>
          Default values
          <template v-slot:actions>
            <v-btn icon @click="item.defaultValue = [...item.defaultValue, '']"><v-icon>mdi-plus</v-icon></v-btn>
          </template>
        </v-banner>
        <v-text-field
          v-for="(_it, index) of item.defaultValue"
          :key="index"
          v-model="item.defaultValue[index]"
          filled
          hide-details="auto"
          small
          @input="() => item.currentValue = item.defaultValue"
        >
          <template #append>
            <v-btn icon @click="item.defaultValue = ([...item.defaultValue]).filter((_, idx) => idx !== index)"><v-icon>mdi-minus</v-icon></v-btn>
          </template>
        </v-text-field>
      </template>
      <v-text-field readonly v-if="editation" label="Variable in messages" :value="`{settings.${item.name}}`" hide-details/>
      <v-text-field readonly v-if="editation" label="Variable in scripts" :value="`settings.${item.name}`" hide-details/>
      <v-btn :color="editation ? 'error' : 'dark'" block class="my-2" @click="() => emit('click')">
        {{ editation ? 'Remove variable' : 'Add new variable' }}
      </v-btn>
    </v-card-text>
    <v-card-actions class="justify-end">
      <v-btn
        text
        @click="closeDialog"
      >Close</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { Plugin } from '@sogebot/backend/src/database/entity/plugins';
import { isNumber } from 'lodash';

type Props = {
  value: NonNullable<Plugin['settings']>[number];
  editation: boolean;
};

const emit = defineEmits(['click', 'update:value', 'close']);
const props = defineProps<Props>();

const item = computed({
  get: () => props.value,
  set: value => emit('update:value', value),
});

const closeDialog = () => {
  emit('close');
};

watch(() => item.value.type, (val) => {
  console.log({val})
  if (val === 'number') {
    item.value.currentValue = isNaN(Number(item.value.currentValue)) ? 0 : Number(item.value.currentValue);
    item.value.defaultValue = isNaN(Number(item.value.defaultValue)) ? 0 : Number(item.value.defaultValue);
  }
  if (val === 'string') {
    item.value.currentValue = String(item.value.currentValue);
    item.value.defaultValue = String(item.value.defaultValue);
  }
  if (val === 'array') {
    if (!Array.isArray(item.value.currentValue) || isNumber(item.value.currentValue) || [...item.value.currentValue].length > 0) {
      item.value.currentValue = [];
    }
    if (!Array.isArray(item.value.defaultValue) || isNumber(item.value.defaultValue) || [...item.value.defaultValue].length > 0) {
      item.value.defaultValue = [];
    }
  }
});
</script>
