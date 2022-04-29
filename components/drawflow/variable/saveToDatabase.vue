<template>
  <div ref="pointer">
    <v-toolbar dense color="blue-grey darken-4">
      <v-icon color="white" left>
        mdi-variable
      </v-icon>
      <v-toolbar-title class="text-button white--text">
        Save variable to database
      </v-toolbar-title>
    </v-toolbar>
    <v-card dark>
      <v-card-text>
        <v-text-field label="Variable name" placeholder="variableName" v-model="item"/>
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

watch(pointer, (value) => {
  nodeId.value = value?.parentElement?.parentElement?.id ?? null;

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

    console.log(data.value)
    if (data.value) {
      value.value = JSON.parse(data.value).value || '';
    }
  }
});

watch([value], (value) => {
  data.value = JSON.stringify({
    value: value[0],
  })
})
</script>
