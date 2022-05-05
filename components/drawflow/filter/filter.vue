<template>
  <div ref="pointer">
    <v-toolbar dense color="blue-grey darken-4">
      <v-icon color="white" left>
        mdi-filter
      </v-icon>
      <v-toolbar-title class="text-button white--text">
      Filter
      </v-toolbar-title>
    </v-toolbar>
    <v-card dark>
      <v-card-text>
        <registry-alerts-inputs-query-filter force-expand v-model="item" :rules="Object.entries(attributes)" v-if="Object.entries(attributes).length > 0" />
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { getSocket } from '@sogebot/ui-helpers/socket';

import { EventBus } from '../../../functions/event-bus';

import { flatten } from '~/functions/flatten';

const pointer = ref(null as null | HTMLElement);
const nodeId = ref(null as null | string);
const attributes = ref({});

const item = ref(null);
watch(item, (value) => {
  if (nodeId.value) {
    EventBus.$emit('drawflow::node::update', nodeId.value, value);
  }
});

watch(pointer, (value) => {
  nodeId.value = value?.parentElement?.parentElement?.id ?? null;

  if (nodeId.value) {
    EventBus.$emit('drawflow::node::value', nodeId.value, (val) => {
      item.value = val;
    });
  }
});

// get all parents
const interval = setInterval(() => {
  EventBus.$emit('drawflow::getCommonParents', nodeId.value, (err, parents, allNodes) => {
    if (err) {
      clearInterval(interval);
      return;
    }
    const commonAttributes: Record<string, any> = {};

    // get variables
    for (const node of allNodes) {
      if (node.name === 'variableLoadFromDatabase') {
        commonAttributes[node.data.value] = 'any';
      }
      if (node.name === 'variableSetVariable') {
        commonAttributes[node.data.value] = 'any';
      }
    }

    // console.log(nodeId.value, parents);
    getSocket('/core/plugins').emit('listeners', (data) => {
      let initial = true;
      for (const parent of parents) {
        const listener = data[parent.data.value];

        if (listener) {
          if (initial) {
            initial = false;
            for (const key of Object.keys(flatten(listener))) {
              // console.log('Nothing to check adding', key)
              commonAttributes[key] = flatten(listener)[key];
            }
          } else {
            for (const key of Object.keys(flatten(listener))) {
              // console.log('Checking listener => common', nodeId.value, key)
              if (commonAttributes[key] !== flatten(listener)[key]) {
                // console.log('Removing', key)
                delete commonAttributes[key];
              }
            }
            for (const key of Object.keys(commonAttributes)) {
              if (key.startsWith('parameters.')) {
                continue;
              }
              // console.log('Checking common => lister', nodeId.value, key)
              if (commonAttributes[key] !== flatten(listener)[key]) {
                // console.log('Removing', key)
                delete commonAttributes[key];
              }
            }
          }

          // add all parameters
          const parameters = JSON.parse(parent.data.data).parameters;
          for (const param of parameters) {
            console.log(`parameters.${param.name}`)
            commonAttributes[`parameters.${param.name}`] = param.type === 'number' ? 'number' : 'string';
          }
        }
      }
      attributes.value = { ...commonAttributes };
    });
  });
}, 100);
</script>
