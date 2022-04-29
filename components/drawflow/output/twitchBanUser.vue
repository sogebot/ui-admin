<template>
  <div ref="pointer">
    <v-toolbar dense color="blue-grey darken-4">
      <v-icon color="white" left>
        mdi-gavel
      </v-icon>
      <v-toolbar-title class="text-button white--text">
        Ban user
      </v-toolbar-title>
    </v-toolbar>
    <v-card dark v-if="!haveUserParam" >
      <v-card-text>
        <v-alert type="error" color="red" class="ma-0">
          This filter needs to be linked with listeners with sender attributes
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { flatten } from '~/functions/flatten';
import { EventBus } from '~/functions/event-bus';
import { getSocket } from '@sogebot/ui-helpers/socket';

const pointer = ref(null as null | HTMLElement);
const nodeId = ref(null as null | string);

watch(pointer, (value) => {
  nodeId.value = value?.parentElement?.parentElement?.id ?? null;
});

const haveUserParam = ref(false);

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
      haveUserParam.value = !!Object.keys(commonAttributes).find(key => key.startsWith('sender'));
    });
  });
}, 100);
</script>
