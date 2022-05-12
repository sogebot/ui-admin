<template>
  <div ref="pointer">
    <v-card dark color="info">
      <v-card-text class="pa-1">
        <v-textarea v-model="item" dense hide-details="" filled auto-grow solo-inverted rows="1"></v-textarea>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { EventBus } from '~/functions/event-bus';

const item = ref('');

const pointer = ref(null as null | HTMLElement);
const nodeId = ref(null as null | string);

watch(pointer, (value) => {
  nodeId.value = value?.parentElement?.parentElement?.id ?? null;

  if (nodeId.value) {
    EventBus.$emit('drawflow::node::value', nodeId.value, (val) => {
      item.value = val;
    });
    EventBus.$emit(``, nodeId.value);
  }
});

watch(item, (value) => {
  if (nodeId.value) {
    EventBus.$emit('drawflow::node::update', nodeId.value, value);
  }
});
</script>
