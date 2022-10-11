<template>
  <div ref="pointer">
    <v-toolbar dense color="blue-grey darken-4">
      <v-toolbar-title class="text-button white--text">
        Run JS on Custom Overlay
      </v-toolbar-title>
    </v-toolbar>
    <v-card dark>
      <v-card-text>
        <v-text-field
          :style="{
            minWidth: '300px'
          }"
          label="Overlay ID"
          v-model="item"></v-text-field>
        <prism-editor v-model="javascript" class="runCustomJSEditor" :tab-size="4" :highlight="highlighterJS" line-numbers />
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
const data = ref('""');
const javascript = ref('');

watch([item, data], (val) => {
  if (nodeId.value) {
    EventBus.$emit('drawflow::node::update', nodeId.value, val[0], val[1]);
  }
});

watch(pointer, (value) => {
  nodeId.value = value?.parentElement?.parentElement?.id ?? null;

  if (nodeId.value) {
    EventBus.$emit('drawflow::node::value', nodeId.value, (val, _data) => {
      item.value = val;
      data.value = _data;
      javascript.value = JSON.parse(_data) || '';
    });
  }
});

watch([javascript], (val) => {
  data.value = JSON.stringify(val[0]);
});
</script>

<style scoped>
  .runCustomJSEditor {
    background-color: rgb(45 45 45) !important;
    font-size: 12px;
    font-family: "Roboto Mono", monospace;
    width: 100%;
  }

  .runCustomJSEditor .prism-editor__textarea {
    outline: none !important;
    outline-width: 0 !important;
    border: 0 !important;
    padding: 5px;
  }

  .runCustomJSEditor .prism-editor__container > * {
    padding: 5px;
  }
  </style>