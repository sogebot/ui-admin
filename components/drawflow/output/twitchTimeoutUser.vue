<template>
  <div ref="pointer">
    <v-toolbar dense color="blue-grey darken-4">
      <v-icon color="white" left>
        mdi-gavel
      </v-icon>
      <v-toolbar-title class="text-button white--text">
        Timeout user
      </v-toolbar-title>
    </v-toolbar>
    <v-card dark>
      <v-card-text>
        <v-alert v-if="!haveUserParam" type="error" color="red" class="ma-0">
          This filter needs to be linked with listeners with sender attributes
        </v-alert>
        <template v-else>
          <v-text-field label="Seconds" v-model="item"/>
        </template>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { flatten } from '~/functions/flatten';
import { EventBus } from '~/functions/event-bus';
import { getSocket } from '@sogebot/ui-helpers/socket';

const item = ref(0);

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

const haveUserParam = ref(false);
watch(haveUserParam, () => {
  nextTick(() => {
    EventBus.$emit(`drawflow::node::redraw`, nodeId.value);
  });
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
      haveUserParam.value = !!Object.keys(commonAttributes).find(key => key.startsWith('sender'));
    });
  });
}, 100);
</script>
