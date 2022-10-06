<template>
  <div ref="pointer">
    <v-toolbar dense color="blue-grey darken-4">
      <v-icon color="white" left>
        mdi-numberic
      </v-icon>
      <v-toolbar-title class="text-button white--text">
        Update Counter
      </v-toolbar-title>
    </v-toolbar>
    <v-card dark>
      <v-card-text>
        <v-text-field v-model="item" label="Increment or decrement value" hint="Number or {variable}" />
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { EventBus } from '~/functions/event-bus';

const pointer = ref(null as null | HTMLElement);
const nodeId = ref(null as null | string);
const item = ref(0);

watch(pointer, (pointerValue) => {
  nodeId.value = pointerValue?.parentElement?.parentElement?.id ?? null;

  if (nodeId.value) {
    EventBus.$emit('drawflow::node::value', nodeId.value, (val) => {
      item.value = val;
    });
  }
});

watch([item], (val) => {
  if (nodeId.value) {
    EventBus.$emit('drawflow::node::update', nodeId.value, val[0]);
  }
});
</script>
