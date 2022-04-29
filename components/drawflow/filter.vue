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
        <template #activator="{ on, attrs }">
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
      </v-menu>
    </v-toolbar>
    <v-card dark>
      <v-card-text>
        {{ attributes }}
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { getSocket } from '@sogebot/ui-helpers/socket';

import { EventBus } from '../../functions/event-bus';

import { flatten } from '~/functions/flatten';

const pointer = ref(null as null | HTMLElement);
const nodeId = ref(null as null | string);
const attributes = ref({});

watch(pointer, (value) => {
  nodeId.value = value?.parentElement?.parentElement?.id ?? null;
});

// get all parents
const interval = setInterval(() => {
  EventBus.$emit('drawflow::getCommonParents', nodeId.value, (err, parents) => {
    if (err) {
      clearInterval(interval);
      return;
    }
    const commonAttributes: Record<string, any> = {};

    // console.log(nodeId.value, parents);
    getSocket('/core/plugins').emit('listeners', (data) => {
      let initial = true;
      for (const parent of parents) {
        const listener = data[parent.data.value];
        // console.log({listener, data, value: parent.data.value})
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
              // console.log('Checking common => lister', nodeId.value, key)
              if (commonAttributes[key] !== flatten(listener)[key]) {
                // console.log('Removing', key)
                delete commonAttributes[key];
              }
            }
          }
        }
      }
      attributes.value = { ...commonAttributes };
    });
  });
}, 100);
</script>
