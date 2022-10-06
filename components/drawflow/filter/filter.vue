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
        <prism-editor v-model="item" class="editor" :tab-size="4" :highlight="highlighterJS" />
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { highlighterJS, PrismEditor } from '~/functions/prismjs';

import { EventBus } from '~/functions/event-bus';

const pointer = ref(null as null | HTMLElement);
const nodeId = ref(null as null | string);

const item = ref(null as string | null);
const data = ref('{}');
const advancedMode = ref(true);

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
</script>
