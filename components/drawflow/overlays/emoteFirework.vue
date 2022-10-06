<template>
  <div ref="pointer">
    <v-toolbar dense color="blue-grey darken-4">
      <v-toolbar-title class="text-button white--text">
        {{$t('emote-firework')}}
      </v-toolbar-title>
    </v-toolbar>
    <v-card dark>
      <v-card-text>
        <v-text-field
          :style="{
            minWidth: '300px'
          }"
          :label="$t('events.definitions.emotesToFirework.label')"
          :hint="$t('events.definitions.emotesToFirework.placeholder')"
          v-model="item"></v-text-field>
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
  }
});

watch(item, (value) => {
  if (nodeId.value) {
    EventBus.$emit('drawflow::node::update', nodeId.value, value);
  }
});
</script>
