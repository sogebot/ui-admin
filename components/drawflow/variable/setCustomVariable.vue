<template>
  <div ref="pointer">
    <v-toolbar dense color="blue-grey darken-4">
      <v-icon color="white" left>
        mdi-variable
      </v-icon>
      <v-toolbar-title class="text-button white--text">
        Set custom variable
      </v-toolbar-title>
    </v-toolbar>
    <v-card dark>
      <v-card-text>
        <v-text-field v-model="item" label="Custom variable name" placeholder="$_variableName"/>
        <v-text-field v-model="value" label="Set value" hint="Number, string or {variableName}"/>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { EventBus } from '~/functions/event-bus';

const item = ref('');
const data = ref('{}');

const value = ref('');

const pointer = ref(null as null | HTMLElement);
const nodeId = ref(null as null | string);

watch(pointer, (pointerValue) => {
  nodeId.value = pointerValue?.parentElement?.parentElement?.id ?? null;

  if (nodeId.value) {
    EventBus.$emit('drawflow::node::value', nodeId.value, (val, _data) => {
      item.value = val;
      data.value = _data;
    });
  }
});

watch([item, data], (val) => {
  if (nodeId.value) {
    EventBus.$emit('drawflow::node::update', nodeId.value, val[0], val[1]);

    console.log(data.value);
    if (data.value) {
      value.value = JSON.parse(data.value).value || '';
    }
  }
});

watch(value, (val) => {
  data.value = JSON.stringify({ value: val });
});
</script>