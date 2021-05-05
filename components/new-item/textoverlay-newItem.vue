<template>
  <v-stepper :key="item ? item.id : 'create'" v-model="e1">
    <v-stepper-header>
      <v-stepper-step
        :complete="e1 > 1"
        step="1"
        editable
        :rules="[() => valid1]"
      >
        Name your text overlay
      </v-stepper-step>

      <v-divider />

      <v-stepper-step
        :complete="e1 > 2"
        step="2"
        editable
      >
        3rd party libraries
        <small>Optional</small>
      </v-stepper-step>

      <v-divider />

      <v-stepper-step
        :complete="e1 > 3"
        step="3"
        editable
      >
        HTML / Text
      </v-stepper-step>

      <v-divider />

      <v-stepper-step
        :complete="e1 > 4"
        step="4"
        editable
      >
        JS
        <small>Optional</small>
      </v-stepper-step>

      <v-divider />

      <v-stepper-step
        :complete="e1 > 5"
        step="5"
        editable
      >
        CSS
        <small>Optional</small>
      </v-stepper-step>
    </v-stepper-header><v-stepper-items>
      <v-stepper-content :step="1">
        <v-form
          ref="form1"
          v-model="valid1"
          lazy-validation
        >
          <v-text-field
            v-model="name"
            :label="translate('name')"
            :rules="rules.name"
            hide-details="auto"
            required
            counter
          />
        </v-form>
      </v-stepper-content>

      <v-stepper-content :step="2">
        <v-textarea
          v-model="libraries"
          label="External libraries"
          hint="Separated by new-line, e.g. https://code.jquery.com/jquery-3.6.0.slim.min.js"
          persistent-hint
          hide-details="auto"
        />
      </v-stepper-content>

      <v-stepper-content :step="3">
        <codemirror
          v-model="html"
          class="w-100"
          :options="{
            tabSize: 4,
            mode : 'xml',
            htmlMode: true,
            theme: 'base16-dark',
            lineNumbers: true,
            line: true,
            matchBrackets: true
          }"
        />
      </v-stepper-content>

      <v-stepper-content :step="4">
        <codemirror
          v-model="js"
          class="w-100"
          :options="{
            tabSize: 4,
            mode : 'javascript',
            theme: 'base16-dark',
            lineNumbers: true,
            line: true,
            matchBrackets: true
          }"
        />
      </v-stepper-content>

      <v-stepper-content :step="5">
        <codemirror
          v-model="css"
          class="w-100"
          :options="{
            tabSize: 4,
            mode : 'text/css',
            theme: 'base16-dark',
            lineNumbers: true,
            line: true,
            matchBrackets: true
          }"
        />
      </v-stepper-content>

      <v-sheet>
        <v-btn
          plain
          class="ma-2"
          @click="closeDlg"
        >
          close
        </v-btn>
        <v-btn
          v-if="e1 < 5"
          plain
          class="ma-2"
          @click="validateForm"
        >
          next step
        </v-btn>

        <v-btn
          class="ma-2"
          color="primary"
          :disabled="!valid1"
          @click="newItem"
        >
          yes, {{ item ? 'update' : 'create' }}
        </v-btn>
      </v-sheet>
    </v-stepper-items>
  </v-stepper>
</template>

<script lang="ts">
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { defineComponent, ref } from '@vue/composition-api';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/mode/xml/xml.js';
import 'codemirror/mode/css/css.js';
import 'codemirror/lib/codemirror.css';
import { v4 } from 'uuid';
import { codemirror } from 'vue-codemirror';

import type { TextInterface } from '.bot/src/bot/database/entity/text';

type Props = {
  rules: Record<string, any[]>,
  item: null | TextInterface,
};

export default defineComponent({
  components: { codemirror },
  props:      { rules: Object, item: Object },
  setup (props: Props, ctx) {
    const e1 = ref(1);
    const newItemSaving = ref(false);

    const name = ref(props.item ? props.item.name : '');
    const id = ref(props.item ? props.item.id : v4());
    const libraries = ref(props.item ? props.item.external.join('\n') : '');
    const html = ref(
      props.item
        ? props.item.text
        : '<!-- you can also use html here, global filters and custom variables are also available -->\n\n');
    const css = ref(
      props.item
        ? props.item.css
        : '');
    const js = ref(
      props.item
        ? props.item.js
        : 'function onLoad() { // triggered on page load\n\n}\n\nfunction onChange() { // triggered on variable change\n\n}');

    const form1 = ref(null);
    const valid1 = ref(true);

    const newItem = async () => {
      if ((form1.value as unknown as HTMLFormElement).validate()) {
        newItemSaving.value = true;
        await new Promise(() => {
          const item: TextInterface = {
            id:       id.value,
            name:     name.value,
            text:     html.value,
            css:      css.value,
            js:       js.value,
            external: libraries.value.split('\n').map(o => o.trim()).filter(Boolean),
          };
          console.log('Saving', { item });
          getSocket('/registries/text').emit('text::save', item, () => {
            ctx.emit('save');
            newItemSaving.value = false;
          });
        });
      }
    };

    const closeDlg = () => {
      ctx.emit('close');
    };

    const validateForm = () => {
      if (e1.value === 1) {
        (form1.value as unknown as HTMLFormElement).validate();
      }
      e1.value++;
    };

    return {
      name,
      libraries,
      html,
      js,
      css,
      newItem,

      e1,
      translate,
      newItemSaving,
      form1,
      valid1,
      closeDlg,
      validateForm,
    };
  },
});
</script>
