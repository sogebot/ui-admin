<template>
  <div ref="pointer">
    <v-toolbar dense color="blue-grey darken-4">
      <v-icon color="white" left>
        mdi-variable
      </v-icon>
      <v-toolbar-title class="text-button white--text">
        Define variable
      </v-toolbar-title>
    </v-toolbar>
    <v-card dark>
      <v-card-text>
        <v-text-field label="Variable name" placeholder="variableName" v-model="item"/>
        <v-text-field label="Value" placeholder="5" v-model="value"/>
        <v-checkbox
          v-model="isShared"
          dense
          color="white"
          hide-details="auto"
          label="Shared variable"
        />
        <v-checkbox
          v-if="isShared"
          v-model="reset"
          dense
          color="white"
          hide-details="auto"
          label="Reset variable value"
        />
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { EventBus } from '~/functions/event-bus';

const item = ref('');
const data = ref('{}');

const value = ref('');
const isShared = ref(false);
const reset = ref(false);

const pointer = ref(null as null | HTMLElement);
const nodeId = ref(null as null | string);

watch(nodeId, (val) => {
  if (val) {
    EventBus.$emit(`drawflow::node::redraw`, val);
  }
});

watch(pointer, (value) => {
  nodeId.value = value?.parentElement?.parentElement?.id ?? null;

  if (nodeId.value) {
    EventBus.$emit('drawflow::node::value', nodeId.value, (val, _data) => {
      item.value = val;
      data.value = _data;
    });
    EventBus.$emit(`drawflow::node::redraw`, nodeId.value);
  }
});

watch([item, data], (val) => {
  if (nodeId.value) {
    EventBus.$emit('drawflow::node::update', nodeId.value, val[0], val[1]);

    console.log(data.value)
    if (data.value) {
      value.value = JSON.parse(data.value).value || '';
      isShared.value = JSON.parse(data.value).isShared || false;
      reset.value = JSON.parse(data.value).reset || false;
    }
  }
});

watch([value, isShared, reset], (value) => {
  data.value = JSON.stringify({
    value: value[0],
    isShared: value[1],
    reset: value[2],
  })
})
</script>
