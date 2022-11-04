<template>
  <div ref="pointer">
    <v-toolbar dense color="blue-grey darken-4">
      <v-icon color="white" left>
        mdi-code-braces
      </v-icon>
      <v-toolbar-title class="text-button white--text">
        Run script
      </v-toolbar-title>
    </v-toolbar>
    <v-card dark>
      <v-card-text>
        <prism-editor
        v-model="item"
        class="runScriptEditor"
        :tab-size="2"
        :highlight="highlighterJS"
        line-numbers/>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { EventBus } from '~/functions/event-bus';
import { highlighterJS, PrismEditor } from '~/functions/prismjs';

const pointer = ref(null as null | HTMLElement);
const nodeId = ref(null as null | string);

const item = ref(null as string | null);
const data = ref('{}');
const advancedMode = ref(true);

watch([item, data], (val) => {
  if (nodeId.value) {
    EventBus.$emit('drawflow::node::update', nodeId.value, val[0], val[1]);
  }
});

watch(pointer, (value) => {
  nodeId.value = value?.parentElement?.parentElement?.id ?? null;

  if (nodeId.value) {
    EventBus.$emit('drawflow::node::value', nodeId.value, (val, _data) => {
      advancedMode.value = JSON.parse(_data).advancedMode ?? false;
      item.value = val;
      data.value = _data;
    });
  }
});
</script>

<style>
.runScriptEditor {
  background-color: rgb(45 45 45) !important;
  font-size: 12px;
  font-family: "Roboto Mono", monospace;
  max-width: 50vw;
  max-height: 70vh;
  height: fit-content;
  padding: 5px;
}

.runScriptEditor .prism-editor__textarea,
.runScriptEditor .prism-editor__textarea:focus {
  outline: 0 !important;
  outline-width: 0 !important;
  border: 0 !important;
}
</style>