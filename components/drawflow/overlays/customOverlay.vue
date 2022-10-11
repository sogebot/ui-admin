<template>
  <div ref="pointer">
    <v-toolbar dense color="blue-grey darken-4">
      <v-toolbar-title class="text-button white--text">
        Custom overlay
      </v-toolbar-title>
    </v-toolbar>
    <v-card dark>
      <v-card-text>
        <v-text-field
          :style="{
            minWidth: '300px'
          }"
          label="ID"
          readonly
          hide-details
          :value="item"
        >
          <template #append>
            <v-btn icon @click="copy(item)">
              <v-icon>mdi-content-copy</v-icon>
            </v-btn>
          </template>
        </v-text-field>
        <v-text-field
          :style="{
            minWidth: '300px'
          }"
          label="URL"
          readonly
          hide-details
          :value="computedURL"
        >
          <template #append>
            <v-btn icon @click="copy(computedURL)">
              <v-icon>mdi-content-copy</v-icon>
            </v-btn>
          </template>
        </v-text-field>
        <v-dialog v-model="dialog" persistent>
          <template #activator="{ on, attrs }">
            <v-btn block v-bind="attrs" class="mt-4" v-on="on">
              Edit
            </v-btn>
          </template>
          <v-card>
            <v-card-text class="pa-4">
              <v-row justify="center">
                <v-expansion-panels accordion>
                  <v-expansion-panel>
                    <v-expansion-panel-header>HTML - inside &#60;body	&#62;</v-expansion-panel-header>
                    <v-expansion-panel-content>
                      <prism-editor
                        v-model="body"
                        class="overlayEditor"
                        :tab-size="4"
                        :highlight="highlighterHTML"
                        line-numbers
                      />
                    </v-expansion-panel-content>
                  </v-expansion-panel>
                  <v-expansion-panel>
                    <v-expansion-panel-header>JAVASCRIPT - initialized on start</v-expansion-panel-header>
                    <v-expansion-panel-content>
                      <p>All variables from database are available in variables and settings objects.</p>
                      <prism-editor
                        v-model="javascript"
                        class="overlayEditor"
                        :tab-size="4"
                        :highlight="highlighterJS"
                        line-numbers
                      />
                    </v-expansion-panel-content>
                  </v-expansion-panel>
                  <v-expansion-panel>
                    <v-expansion-panel-header>CSS</v-expansion-panel-header>
                    <v-expansion-panel-content>
                      <prism-editor
                        v-model="css"
                        class="overlayEditor"
                        :tab-size="4"
                        :highlight="highlighterCSS"
                        line-numbers
                      />
                    </v-expansion-panel-content>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-row>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn text @click="dialog = false">
                Close
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { EventBus } from '~/functions/event-bus';
import {
  highlighterCSS, highlighterHTML, highlighterJS, PrismEditor,
} from '~/functions/prismjs';

const route = useRoute();
const item = ref('');
const dialog = ref(false);
const data = ref('{ body: "", javascript: "", css: "" }');

const body = ref('');
const javascript = ref('');
const css = ref('');

const pointer = ref(null as null | HTMLElement);
const nodeId = ref(null as null | string);

const copy = (text: string) => {
  navigator.clipboard.writeText(text);
  EventBus.$emit('snack', 'success', 'Text field copied to clipboard.');
};

const computedURL = computed(() => {
  return location.origin + `/overlays/plugins/${route.params.id}/${item.value}`;
});

watch(pointer, (value) => {
  nodeId.value = value?.parentElement?.parentElement?.id ?? null;

  if (nodeId.value) {
    EventBus.$emit('drawflow::node::value', nodeId.value, (val: string, _data: any) => {
      if (val) {
        item.value = val;
      }
      data.value = _data;
      try {
        body.value = JSON.parse(_data).body || '';
        javascript.value = JSON.parse(_data).javascript || '';
        css.value = JSON.parse(_data).css || '';
      } catch {
        body.value = '';
        javascript.value = '';
        css.value = '';
      }
    });
  }
});

watch([item, data], (val) => {
  if (nodeId.value) {
    EventBus.$emit('drawflow::node::update', nodeId.value, val[0], val[1]);
  }
});

watch([body, javascript, css], (val) => {
  data.value = JSON.stringify({ body: val[0], javascript: val[1], css: val[2] });
});
</script>

<style>
  .overlayEditor {
    background-color: rgb(45 45 45) !important;
    font-size: 12px;
    font-family: "Roboto Mono", monospace;
    width: 100%;
    height: 30vh;
    padding: 5px;
  }

  .overlayEditor .prism-editor__textarea,
  .overlayEditor .prism-editor__textarea:focus {
    outline: 0 !important;
    outline-width: 0 !important;
    border: 0 !important;
  }
  </style>
