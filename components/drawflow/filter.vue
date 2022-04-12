<template>
  <div ref="pointer">
    <v-toolbar dense color="blue-grey darken-4">
      <v-icon color="white" left>
        mdi-filter
      </v-icon>
      <v-toolbar-title class="text-button white--text">
        Event filter
      </v-toolbar-title>
    <v-menu
      :close-on-content-click="false"
    >
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          class="ml-4"
          color="white"
          icon
          small
          v-bind="attrs"
          v-on="on"
        >
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
      </template>

      <v-list>
        <v-subheader>OUTPUTS</v-subheader>
        <v-list-item>
          <v-btn icon @click="output('+')">
            <v-icon>mdi-plus</v-icon>
          </v-btn>
          <v-btn icon @click="output('-')">
            <v-icon>mdi-minus</v-icon>
          </v-btn>
        </v-list-item>
        <v-subheader>INPUTS</v-subheader>
        <v-list-item>
          <v-btn icon @click="input('+')">
            <v-icon>mdi-plus</v-icon>
          </v-btn>
          <v-btn icon @click="input('-')">
            <v-icon>mdi-minus</v-icon>
          </v-btn>
        </v-list-item>
      </v-list>
    </v-menu>
    </v-toolbar>
  </div>
</template>

<script setup lang="ts">import { EventBus } from '../../functions/event-bus';

const pointer = ref(null as null | HTMLElement);
const nodeId = ref(null as null | string);

watch(pointer, (value) => {
  nodeId.value = value?.parentElement?.parentElement?.id ?? null;
});

const input = (value: '+' | '-') => {
  EventBus.$emit('drawflow::node::input', nodeId.value, value);
};

const output = (value: '+' | '-') => {
  EventBus.$emit('drawflow::node::output', nodeId.value, value);
};
</script>
