<template>
  <v-form
    ref="form"
    v-model="valid"
    lazy-validation
  >
    <v-text-field
      v-model="title"
      :label="capitalize(translate('systems.polls.title'))"
      :rules="rules.title"
      hide-details="auto"
      required
      counter
    />

    <v-select
      v-model="type"
      :items="typeItems"
      :label="capitalize(translate('systems.polls.votingBy'))"
      :return-object="false"
    />
    <v-text-field
      v-for="(option, index) of options"
      :key="'poll-option-' + index"
      v-model="options[index]"
      :class="{'pa-0': index > 0}"
      :label="'Answer ' + String(index + 1)"
      hide-details="auto"
      counter
      :error="isDirtyOptions && validOptions !== true"
      :error-messages="typeof validOptions === 'string' && validOptions.length > 0 && index === 4 ? [validOptions] : undefined"
      @keypress="isDirtyOptions = true"
    />

    <v-btn
      class="mr-4"
      :loading="newItemSaving"
      :disabled="!valid && validOptions !== true"
      @click="newItem"
    >
      submit
    </v-btn>

    <v-btn
      class="mr-4"
      @click="closeDlg"
    >
      close
    </v-btn>
  </v-form>
</template>

<script lang="ts">
import { type } from 'os';
import { title } from 'process';

import {
  computed, defineComponent, ref,
} from '@nuxtjs/composition-api';
import options from '@nuxtjs/vuetify/dist/options';
import translate from '@sogebot/ui-helpers/translate';
import axios from 'axios';
import { capitalize } from 'lodash';
import { v4 } from 'uuid';
import {
  VBtn, VForm, VSelect, VTextField,
} from 'vuetify/lib';

import { rules } from '~/stylelint.config';

export default defineComponent({
  props: { tags: Array, rules: Object },
  setup (props, ctx) {
    const title = ref('');
    const type = ref('normal');
    const options = ref(['', '', '', '', ''] as string[]);
    const isDirtyOptions = ref(false);
    const validOptions = computed((): boolean | string => {
      let valid = true;
      if (isDirtyOptions.value) {
        for (const validator of props.rules?.options) {
          if (!valid) {
            break;
          }
          valid = validator(options.value);
        }
      }
      return valid;
    });

    const typeItems = [
      {
        text:     translate('systems.polls.normal'),
        value:    'normal',
        disabled: false,
      },
      {
        text:     translate('systems.polls.tips'),
        value:    'tips',
        disabled: false,
      },
      {
        text:     translate('systems.polls.numbers'),
        value:    'numbers',
        disabled: false,
      },
      {
        text:     translate('systems.polls.bits'),
        value:    'bits',
        disabled: false,
      },
    ];

    const newItemSaving = ref(false);
    const valid = ref(true);

    const form = ref(null);

    const newItem = async () => {
      isDirtyOptions.value = true;
      if ((form.value as unknown as HTMLFormElement).validate() && validOptions.value === true) {
        newItemSaving.value = true;
        await new Promise((resolve) => {
          const item = {
            id:       v4(),
            type:     (type.value as any),
            title:    title.value,
            options:  options.value.filter(o => o.length > 0),
            openedAt: new Date().toISOString(),
          };
          console.log('Saving', { item });
          axios.post(`/api/systems/polls`, item, { headers: { authorization: `Bearer ${localStorage.accessToken}` } })
            .then(() => {
              resolve(true);
              ctx.emit('save');
              newItemSaving.value = false;
            });
        });
      }
    };

    const closeDlg = () => {
      ctx.emit('close');
    };

    return {
      translate,
      title,
      type,
      typeItems,
      newItemSaving,
      newItem,
      valid,
      closeDlg,
      form,
      capitalize,
      options,
      validOptions,
      isDirtyOptions,
    };
  },
});
</script>
