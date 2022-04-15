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
      </v-list>
    </v-menu>
    </v-toolbar>
    <div class="pa-3 white--text">
    {{ attributes }}
    </div>
  </div>
</template>

<script setup lang="ts">import { getSocket } from '@sogebot/ui-helpers/socket';
import { flatten } from '~/functions/flatten';
import { EventBus } from '../../functions/event-bus';

const pointer = ref(null as null | HTMLElement);
const nodeId = ref(null as null | string);
const attributes = ref({});

watch(pointer, (value) => {
  nodeId.value = value?.parentElement?.parentElement?.id ?? null;
});

// get all parents
setInterval(() => {
  EventBus.$emit('drawflow::getCommonParents', nodeId.value, (parents) => {
    const commonAttributes: Record<string, any> = {};

    console.log(nodeId.value, parents);
    getSocket('/core/plugins').emit('listeners', (data) => {
      let initial = true;
      for (const parent of parents) {
        const listener = data[parent.data.value];
        console.log({listener, data, value: parent.data.value})
        if (listener) {
          if (initial) {
            initial = false;
            for (const key of Object.keys(flatten(listener))) {
              console.log('Nothing to check adding', key)
              commonAttributes[key] = flatten(listener)[key]
            }
          } else {
            for (const key of Object.keys(flatten(listener))) {
              console.log('Checking listener => common', nodeId.value, key)
              if (commonAttributes[key] !== flatten(listener)[key]) {
                console.log('Removing', key)
                delete commonAttributes[key]
              }
            }
            for (const key of Object.keys(commonAttributes)) {
              console.log('Checking common => lister', nodeId.value, key)
              if (commonAttributes[key] !== flatten(listener)[key]) {
                console.log('Removing', key)
                delete commonAttributes[key]
              }
            }
          }
        }
      }
      attributes.value = {...commonAttributes};
    })
  })
}, 1000)

const output = (value: '+' | '-') => {
  EventBus.$emit('drawflow::node::output', nodeId.value, value);
};
</script>
