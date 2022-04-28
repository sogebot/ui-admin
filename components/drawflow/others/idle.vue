<template>
  <div ref="pointer">
    <v-toolbar dense color="blue-grey darken-4">
      <v-icon color="white" left>
        mdi-timer
      </v-icon>
      <v-toolbar-title class="text-button white--text">
        Idle
      </v-toolbar-title>
    </v-toolbar>
    <v-card dark>
      <v-card-text>
        <v-text-field label="Miliseconds" v-model="item" hint="Number or {variableName}"/>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { EventBus } from '~/functions/event-bus';

const item = ref('');

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
    EventBus.$emit('drawflow::node::value', nodeId.value, (val) => {
      item.value = val;
    });
    EventBus.$emit(`drawflow::node::redraw`, nodeId.value);
  }
});

watch(item, (value) => {
  if (nodeId.value) {
    EventBus.$emit('drawflow::node::update', nodeId.value, value);
  }
});
</script>
