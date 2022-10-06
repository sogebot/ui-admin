<template>
  <div ref="pointer">
    <v-toolbar dense color="blue-grey darken-4">
      <v-icon color="white" left>
        mdi-numberic
      </v-icon>
      <v-toolbar-title class="text-button white--text">
        Counter
      </v-toolbar-title>
    </v-toolbar>
    <v-card dark style="min-width: 400px;">
      <v-card-text>
        <v-alert v-if="Object.entries(attributes).length == 0" type="error" color="red" class="ma-0">
          Input must be linked to node
        </v-alert>
        <template v-else>
          <v-switch
            v-model="perUser"
            label="Count per user"
            dense
            hide-details="auto"
            hint="Defines if user have own counter or is global"
            persistent-hint
          />
          <v-switch v-model="resetAfterTrigger" label="Automatically reset counter after trigger" dense hide-details="auto" persistent-hint />
          <v-text-field v-model="item" label="Number gate" hint="Number or {variableName}" />
        </template>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { getSocket } from '@sogebot/ui-helpers/socket';
import { v4 } from 'uuid';

import { EventBus } from '~/functions/event-bus';
import { flatten } from '~/functions/flatten';

const pointer = ref(null as null | HTMLElement);
const nodeId = ref(null as null | string);
const attributes = ref({});

const item = ref(null as string | null);
const data = ref('{}');
const perUser = ref(false);
const resetAfterTrigger = ref(false);
const uuid = ref(v4());

watch([item, data], (val) => {
  if (nodeId.value) {
    EventBus.$emit('drawflow::node::update', nodeId.value, val[0], val[1]);
  }
});

watch(data, (val) => {
  perUser.value = JSON.parse(val).perUser ?? false;
  uuid.value = JSON.parse(val).uuid ?? v4();
});
watch([perUser, uuid, resetAfterTrigger], (val) => {
  data.value = JSON.stringify({
    perUser: val[0], uuid: val[1], resetAfterTrigger: val[2],
  });
});

watch(pointer, (value) => {
  nodeId.value = value?.parentElement?.parentElement?.id ?? null;

  if (nodeId.value) {
    EventBus.$emit('drawflow::node::value', nodeId.value, (val, _data) => {
      perUser.value = JSON.parse(_data).perUser ?? false;
      resetAfterTrigger.value = JSON.parse(_data).resetAfterTrigger ?? false;
      uuid.value = JSON.parse(_data).uuid ?? v4();
      item.value = val;
      data.value = _data;
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
          for (const param of parameters || []) {
            commonAttributes[`parameters.${param.name}`] = param.type === 'number' ? 'number' : 'string';
          }
        }
      }
      attributes.value = { ...commonAttributes };
    });
  });
}, 100);
</script>
