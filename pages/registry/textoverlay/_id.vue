<template>
  <v-card :loading="isLoading">
    <portal to="navbar">
      <v-btn
        small
        v-if="e1 < 5"
        text
        class="ma-2"
        @click="validateForm"
      >
        next step
      </v-btn>
      <v-btn
        small
        :text="!$vuetify.breakpoint.xs"
        :icon="$vuetify.breakpoint.xs"
        :loading="isSaving"
        @click="save"
        :disabled="!valid1"
      >
        <v-icon class="d-flex d-sm-none">{{ mdiFloppy }}</v-icon>
        <span class="d-none d-sm-flex">{{ translate('dialog.buttons.saveChanges.idle') }}</span>
      </v-btn>
    </portal>

    <v-overlay :value="isLoading" dark absolute>
      <v-row>
        <v-col class="text-center">
          <v-progress-circular indeterminate size="48" />
        </v-col>
      </v-row>
    </v-overlay>

    <v-fade-transition>
      <div v-if="!isLoading" class="pa-4">
        <v-stepper v-model="e1">
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
          </v-stepper-header>
          <v-stepper-items>
            <v-stepper-content :step="1">
              <v-form
                ref="form1"
                v-model="valid1"
                lazy-validation
              >
                <v-text-field
                  v-model="item.name"
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
                v-model="item.libraries"
                label="External libraries"
                hint="Separated by new-line, e.g. https://code.jquery.com/jquery-3.6.0.slim.min.js"
                persistent-hint
                hide-details="auto"
              />
            </v-stepper-content>

            <v-stepper-content :step="3">
              <prism-editor
                v-model="item.text"
                style="border: 1px solid gray;"
                line-numbers
                :tab-size="4"
                :highlight="highlighterHTML"
              />
            </v-stepper-content>

            <v-stepper-content :step="4">
              <prism-editor
                v-model="item.js"
                style="border: 1px solid gray;"
                line-numbers
                :tab-size="4"
                :highlight="highlighterJS"
              />
            </v-stepper-content>

            <v-stepper-content :step="5">
              <prism-editor
                v-model="item.css"
                style="border: 1px solid gray;"
                line-numbers
                :tab-size="4"
                :highlight="highlighterCSS"
              />
            </v-stepper-content>
          </v-stepper-items>
        </v-stepper>
      </div>
    </v-fade-transition>
  </v-card>
</template>

<script lang="ts">
import { mdiFloppy } from '@mdi/js';
import {
  defineComponent, onMounted, ref, useRoute, useRouter, useStore,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { v4 } from 'uuid';

import type { TextInterface } from '.bot/src/database/entity/text';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import {
  highlighterCSS, highlighterHTML, highlighterJS, PrismEditor,
} from '~/functions/prismjs';
import { required } from '~/functions/validators';

export default defineComponent({
  components: { PrismEditor },
  setup () {
    const e1 = ref(1);
    const store = useStore();
    const route = useRoute();
    const router = useRouter();

    const isSaving = ref(false);
    const isLoading = ref(true);
    const rules = { name: [required] };

    const item = ref({
      id:       v4(),
      name:     '',
      external: [],
      text:     '<!-- you can also use html here, global filters and custom variables are also available -->\n\n',
      css:      '',
      js:       'function onLoad() { // triggered on page load\n\n}\n\nfunction onChange() { // triggered on variable change\n\n}',
    } as TextInterface);

    const form1 = ref(null);
    const valid1 = ref(true);

    const validateForm = () => {
      if (e1.value === 1) {
        (form1.value as unknown as HTMLFormElement).validate();
      }
      e1.value++;
    };

    const save = () => {
      isSaving.value = true;
      console.log('Saving', item.value);
      getSocket('/registries/text').emit('text::save', item.value, (err: string | null) => {
        if (err) {
          return error(err);
        }
        isSaving.value = false;
        router.push({ params: { id: item.value.id ?? '' } });
        EventBus.$emit('snack', 'success', 'Data saved.');
      });
    };

    onMounted(() => {
      store.commit('panel/back', '/registry/textoverlay');
      if (route.value.params.id && route.value.params.id !== 'new') {
        // load initial item
        isLoading.value = true;
        getSocket('/registries/text').emit('generic::getOne', { id: route.value.params.id, parseText: false }, (err: string | null, data: TextInterface) => {
          if (err) {
            return error(err);
          }
          item.value = data;
          isLoading.value = false;
        });
      } else {
        isLoading.value = false;
      }
    });

    return {
      e1,
      rules,
      isSaving,
      isLoading,
      translate,
      save,
      item,
      form1,
      valid1,
      validateForm,
      highlighterJS,
      highlighterCSS,
      highlighterHTML,
      mdiFloppy,
    };
  },
});
</script>
