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
        <v-alert v-if="Object.entries(attributes).length == 0" type="error" color="red" class="ma-0">
          Input must be linked to node
        </v-alert>
        <template v-else>
          <v-switch v-model="advancedMode" label="Advanced" dense hide-details="auto" />
          <registry-alerts-inputs-query-filter v-if="!advancedMode && isJSON" v-model="item" force-expand :rules="Object.entries(attributes)" />
          <v-textarea
            v-else
            v-model="item"
            label="Evaluate"
            placeholder="5"
            auto-grow
            rows="1"
          />
        </template>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { getSocket } from '@sogebot/ui-helpers/socket';

import { EventBus } from '~/functions/event-bus';
import { flatten } from '~/functions/flatten';

const pointer = ref(null as null | HTMLElement);
const nodeId = ref(null as null | string);
const attributes = ref({});

const item = ref(null as string | null);
const data = ref('{}');
const advancedMode = ref(false);

const isJSON = computed(() => {
  try {
    if (item.value === null) {
      return true;
    }
    JSON.parse(item.value);
    return true
  } catch {
    return false;
  }
})

watch([item, data], (val) => {
  if (nodeId.value) {
    if (advancedMode.value) {
      localStorage.setItem('drawflow::node::filter::advanced::' + nodeId.value, JSON.stringify(val[0]) ?? 'null')
    } else {
      localStorage.setItem('drawflow::node::filter::simple::' + nodeId.value, JSON.stringify(val[0]) ?? 'null')
    }

    EventBus.$emit('drawflow::node::update', nodeId.value, val[0], val[1]);
  }
});

watch(data, (val) => {
  advancedMode.value = JSON.parse(val).advancedMode ?? false;
});
watch(advancedMode, (val) => {
  data.value = JSON.stringify({ advancedMode: val });

  try {
    if (val) {
      item.value = JSON.parse(localStorage.getItem('drawflow::node::filter::advanced::' + nodeId.value) ?? 'null')
    } else {
      item.value = JSON.parse(localStorage.getItem('drawflow::node::filter::simple::' + nodeId.value) ?? 'null')
    }
  } catch (e) {
    item.value = null;
    console.error(e)
  }
});

watch(pointer, (value) => {
  nodeId.value = value?.parentElement?.parentElement?.id ?? null;

  if (nodeId.value) {
    localStorage.removeItem('drawflow::node::filter::simple::' + nodeId.value)
    localStorage.removeItem('drawflow::node::filter::advanced::' + nodeId.value)

    EventBus.$emit('drawflow::node::value', nodeId.value, (val, _data) => {
      advancedMode.value = JSON.parse(_data).advancedMode ?? false;
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
