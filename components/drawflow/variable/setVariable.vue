<template>
  <div ref="pointer">
    <v-toolbar dense color="blue-grey darken-4">
      <v-icon color="white" left>
        mdi-variable
      </v-icon>
      <v-toolbar-title class="text-button white--text">
        Set variable
      </v-toolbar-title>
    </v-toolbar>
    <v-card dark>
      <v-card-text>
        <v-text-field v-model="item" label="Variable name" placeholder="variableName">
        <template #append>
        <v-dialog v-model="dialog" width="500">
          <template v-slot:activator="{ on, attrs }">
            <v-btn icon dark v-bind="attrs" v-on="on">
              <v-icon>mdi-help</v-icon>
            </v-btn>
          </template>

          <v-card>
            <v-card-text class="pt-4">
              <prism-editor v-model="help" readonly class="editor-help" :tab-size="4" :highlight="highlighterJS" />
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="primary" text @click="dialog = false">
                Close
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        </template>
        </v-text-field>
        <prism-editor v-model="value" class="editor" :tab-size="4" :highlight="highlighterJS" />
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { error } from '../../../functions/error';

import { EventBus } from '~/functions/event-bus';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { highlighterJS, PrismEditor } from '~/functions/prismjs';

const item = ref('');
const data = ref('{}');

const value = ref('');
const help = ref('');

const pointer = ref(null as null | HTMLElement);
const nodeId = ref(null as null | string);
const dialog = ref(false);

watch(pointer, (pointerValue) => {
  nodeId.value = pointerValue?.parentElement?.parentElement?.id ?? null;

  if (nodeId.value) {
    EventBus.$emit('drawflow::node::value', nodeId.value, (val, _data) => {
      item.value = val;
      data.value = _data;

      fetch((process.env.isNuxtDev ? 'http://localhost:20000/' : '/') + 'assets/custom-variables-code.txt')
        .then(response => response.text())
        .then((d) => {
          help.value = d.match(/\/\* .* *\//gms)?.[0] ?? '';

          if (_data === '{}') {
            value.value = d.replace(help.value, '').trim();
          }
        })
        .catch((e) => {
          error(e);
        });
    });
  }
});

watch([item, data], (val) => {
  if (nodeId.value) {
    EventBus.$emit('drawflow::node::update', nodeId.value, val[0], val[1]);

    console.log(data.value);
    if (data.value) {
      value.value = JSON.parse(data.value).value || '';
    }
  }
});

watch(value, (val) => {
  data.value = JSON.stringify({ value: val });
});
</script>

<style>
.editor-help,
.editor {
  background-color: rgb(45 45 45) !important;
  font-size: 12px;
  font-family: "Roboto Mono", monospace;
  max-height: 500px;
}

.editor {
  width: 500px;
}

.editor-help .prism-editor__textarea,
.editor .prism-editor__textarea {
  outline: none !important;
  outline-width: 0 !important;
  border: 0 !important;
  padding: 5px;
}

.editor-help .prism-editor__container > *,
.editor .prism-editor__container > * {
  padding: 5px;
}
</style>
