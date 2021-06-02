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
        <prism-editor
          v-model="html"
          style="border: 1px solid gray;"
          line-numbers
          :tab-size="4"
          :highlight="highlighterHTML"
        />
      </v-stepper-content>

      <v-stepper-content :step="4">
        <prism-editor
          v-model="js"
          style="border: 1px solid gray;"
          line-numbers
          :tab-size="4"
          :highlight="highlighterJS"
        />
      </v-stepper-content>

      <v-stepper-content :step="5">
        <prism-editor
          v-model="css"
          style="border: 1px solid gray;"
          line-numbers
          :tab-size="4"
          :highlight="highlighterCSS"
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
import { v4 } from 'uuid';

import type { TextInterface } from '.bot/src/bot/database/entity/text';
import {
  highlighterCSS, highlighterHTML, highlighterJS, PrismEditor,
} from '~/functions/prismjs';

type Props = {
  rules: Record<string, any[]>,
  item: null | TextInterface,
};

export default defineComponent({
  components: { PrismEditor },
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
      highlighterJS,
      highlighterCSS,
      highlighterHTML,
    };
  },
});
</script>
