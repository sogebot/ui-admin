<template>
  <v-stepper :key="item ? item.id : 'create'" v-model="e1">
    <v-stepper-header>
      <v-stepper-step
        :complete="e1 > 1"
        step="1"
        editable
        :rules="[() => valid1]"
      >
        Name your custom variable
      </v-stepper-step>

      <v-stepper-step
        :complete="e1 > 2"
        step="2"
        editable
      >
        Set type and value
      </v-stepper-step>

      <v-divider />
    </v-stepper-header><v-stepper-items>
      <v-stepper-content :step="1">
        <v-form
          ref="form1"
          v-model="valid1"
          lazy-validation
        >
          <v-text-field
            v-model="variableName"
            :label="translate('variableName')"
            :rules="rules.variableName"
            hide-details="auto"
            required
            counter
          />
        </v-form>
      </v-stepper-content>

      <v-stepper-content :step="2">
        <v-select
          v-model="type"
          :items="availableTypes"
          :label="translate('registry.customvariables.type.name')"
        />

        <v-text-field
          v-if="type === 'text' || type === 'number'"
          v-model="currentValue"
          :label="translate('registry.customvariables.currentValue.name')"
        />
        <v-combobox
          v-if="type ==='options'"
          dense
          :value="currentValue"
          :return-object="false"
          :items="availableValues"
          :search-input.sync="optionSearch"
          :label="translate('registry.customvariables.currentValue.name')"
          @change="setCurrentValueOption($event)"
        >
          <template #item="{ item }">
            <v-chip
              :color="`${item.color} lighten-3`"
              dark
              label
              small
            >
              {{ item.text }}
            </v-chip>
            <v-spacer />
            <v-list-item-action class="ma-0" @click.stop>
              <v-btn
                icon
                color="error"
                @click.stop.prevent="removeOption(item)"
              >
                <v-icon>{{ mdiDelete }}</v-icon>
              </v-btn>
            </v-list-item-action>
          </template>
          <template #no-data>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>
                  No results matching "<strong>{{ optionSearch }}</strong>". Press <kbd>enter</kbd> to create a new one
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </template>
        </v-combobox>
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
import { mdiDelete } from '@mdi/js';
import { defaultPermissions } from '@sogebot/ui-helpers/permissions/defaultPermissions';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  computed,
  defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/mode/xml/xml.js';
import 'codemirror/mode/css/css.js';
import 'codemirror/theme/base16-dark.css';
import 'codemirror/theme/base16-light.css';
import 'codemirror/lib/codemirror.css';
import { get } from 'lodash-es';
import { v4 } from 'uuid';
// import { codemirror } from 'vue-codemirror';

import type { VariableInterface } from '.bot/src/bot/database/entity/variable';
import { error } from '~/functions/error';

type Props = {
  rules: Record<string, any[]>,
  item: null | VariableInterface,
};

export default defineComponent({
  // components: { codemirror },
  props: { rules: Object, item: Object },
  setup (props: Props, ctx) {
    const e1 = ref(1);
    const newItemSaving = ref(false);
    const theme = localStorage.getItem('theme') || get(ctx.root.$store.state, 'configuration.core.ui.theme', 'light');

    const id = ref(props.item ? props.item.id : v4());
    const variableName = ref(props.item ? props.item.variableName : '');
    const urls = ref(props.item ? props.item.urls : []);
    const history = ref(props.item ? props.item.history : []);
    const currentValue = ref(props.item ? props.item.currentValue : '');
    const permission = ref(props.item ? props.item.permission : defaultPermissions.MODERATORS);
    const readOnly = ref(props.item ? props.item.readOnly : false);
    const usableOptions = ref(props.item ? props.item.usableOptions : []);
    const runAt = ref(props.item ? props.item.runAt : Date.now());
    const type = ref(props.item ? props.item.type : 'text');
    const description = ref(props.item ? props.item.description : '');
    const responseType = ref(props.item ? props.item.responseType : 0);
    const evalValue = ref(props.item ? props.item.evalValue : '');

    const optionSearch = ref('');

    const form1 = ref(null);
    const valid1 = ref(true);

    const availableTypes = [{
      value: 'number',
      text:  translate('registry.customvariables.types.number'),
    },
    {
      value: 'text',
      text:  translate('registry.customvariables.types.text'),
    },
    {
      value: 'options',
      text:  translate('registry.customvariables.types.options'),
    },
    {
      value: 'eval',
      text:  translate('registry.customvariables.types.eval'),
    }];

    const availableValues = computed(() => {
      return usableOptions.value.map(item => ({
        value: item,
        text:  item,
      }));
    });

    onMounted(() => {
      if (!props.item) {
        // fetch default evalValue
        fetch((process.env.isNuxtDev ? 'http://localhost:20000/' : '/') + 'assets/custom-variables-code.txt')
          .then(response => response.text())
          .then(data => (evalValue.value = data))
          .catch((e) => {
            error(e);
          });
      }
    });

    const newItem = async () => {
      if ((form1.value as unknown as HTMLFormElement).validate()) {
        newItemSaving.value = true;
        await new Promise(() => {
          const item: VariableInterface = {
            id:            id.value,
            variableName:  variableName.value,
            history:       history.value,
            currentValue:  currentValue.value,
            urls:          urls.value,
            permission:    permission.value,
            readOnly:      readOnly.value,
            usableOptions: usableOptions.value,
            runAt:         runAt.value,
            type:          type.value,
            description:   description.value,
            responseType:  responseType.value,
            evalValue:     evalValue.value,
          };
          console.log('Saving', { item });
          getSocket('/registries/text').emit('customvariables::save', item, () => {
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

    watch([type, currentValue], () => {
      if (type.value === 'number') {
        if (!Number.isFinite(Number(currentValue.value))) {
          currentValue.value = '0';
        }
      }
      if (type.value === 'options') {
        if (usableOptions.value.length > 0 && !usableOptions.value.includes(currentValue.value)) {
          currentValue.value = usableOptions.value[0];
        }
      }
    });

    const setCurrentValueOption = (value: string) => {
      if (value.trim().length === 0) {
        return;
      }
      currentValue.value = value;
      if (!usableOptions.value.includes(value)) {
        usableOptions.value.push(value);
      }
    };

    const removeOption = (item: { text: string, value: string }) => {
      usableOptions.value.splice(usableOptions.value.indexOf(item.text), 1);
    };

    return {
      theme,
      variableName,
      evalValue,
      type,
      currentValue,
      newItem,
      optionSearch,

      e1,
      translate,
      newItemSaving,
      form1,
      valid1,
      closeDlg,
      validateForm,

      availableTypes,
      availableValues,
      setCurrentValueOption,
      removeOption,

      mdiDelete,
    };
  },
});
</script>
