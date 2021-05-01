<template>
  <v-stepper :key="item ? item.id : 'create'" v-model="e1">
    <v-stepper-header>
      <v-stepper-step
        :complete="e1 > 1"
        step="1"
        editable
        :rules="[() => typeof isVariableNameValid !== 'string']"
      >
        Name your custom variable
      </v-stepper-step>

      <v-stepper-step
        :complete="e1 > 2"
        step="2"
        editable
        :rules="[() => valid2]"
      >
        Set type and value
      </v-stepper-step>

      <v-divider />
    </v-stepper-header><v-stepper-items>
      <v-stepper-content :step="1">
        <v-text-field
          @input="variableNameDirty = true"
          v-model="variableName"
          :label="translate('registry.customvariables.variable.name')"
          :hint="translate('registry.customvariables.variable.help')"
          :error="typeof isVariableNameValid === 'string'"
          :error-messages="typeof isVariableNameValid === 'string' ? [isVariableNameValid] : []"
          hide-details="auto"
          required
          counter
        >
          <template #append>
            <v-progress-circular size="18" indeterminate v-if="states.isUnique === ButtonStates.progress"></v-progress-circular>
          </template>
        </v-text-field>
      </v-stepper-content>

      <v-stepper-content :step="2">
        <v-form
          ref="form2"
          v-model="valid2"
          lazy-validation
        >
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

          <template v-if="type === 'eval'">
            <codemirror
              v-model="evalValue"
              class="w-100"
              :options="{
                tabSize: 4,
                mode : 'javascript',
                theme: 'base16-' + theme,
                lineNumbers: true,
                line: true,
                matchBrackets: true
              }"
            />

            <v-text-field
              v-model="currentValue"
              readonly
              :label="translate('registry.customvariables.currentValue.name')"
            >
              <template #append-outer>
                <v-btn :loading="states.test !== ButtonStates.idle" @click="testScript">
                  {{ translate('registry.customvariables.testCurrentScript.name') }}
                </v-btn>
              </template>
            </v-text-field>

            <v-select
              v-model="runEveryType"
              :items="availableRunEvery"
              :label="translate('registry.customvariables.runScript.name')"
            >
              <template #append-outer>
                <v-text-field
                  v-if="runEveryType !== 'isUsed'"
                  v-model="runEveryX"
                  :rules="computedRules.runEveryX"
                  class="pa-0 ma-0"
                  style="position: relative; top: -4px;"
                  label="Value"
                  type="number"
                  min="0"
                />
              </template>
            </v-select>
          </template>
        </v-form>
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
          :disabled="!(isVariableNameValid === true) || !(valid2 === true)"
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
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
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
import { codemirror } from 'vue-codemirror';

import type { VariableInterface } from '.bot/src/bot/database/entity/variable';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { minValue, required } from '~/functions/validators';

type Props = {
  rules: Record<string, any[]>,
  item: null | VariableInterface,
};

export default defineComponent({
  components: { codemirror },
  props:      { rules: Object, item: Object },
  setup (props: Props, ctx) {
    const computedRules = {
      runEveryX:    [required, minValue(0)],
      variableName: [
        ...props.rules.variableName,
        () => states.value.isUnique === ButtonStates.progress || states.value.isUnique === ButtonStates.success || translate('registry.customvariables.variable.error.isNotUnique'),
      ],
    };

    const isVariableNameValid = computed(() => {
      if (variableNameDirty.value) {
        for (const validator of computedRules.variableName) {
          const validated = validator(variableName.value);
          console.log(validated);
          if (typeof validated === 'string') {
            return validated;
          }
        }
      }
      return true;
    })

    const e1 = ref(1);
    const newItemSaving = ref(false);
    const theme = localStorage.getItem('theme') || get(ctx.root.$store.state, 'configuration.core.ui.theme', 'light');

    const id = ref(props.item ? props.item.id : v4());
    const variableName = ref(props.item ? props.item.variableName : '');
    const variableNameDirty = ref(false);
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
    const runEveryType = ref(props.item ? props.item.runEveryType : 'isUsed');
    const runEveryX = ref(props.item ? (props.item.runEvery ?? 0) / (props.item.runEvery || 1) : 0);

    const optionSearch = ref('');

    const states = ref({ test: ButtonStates.idle as number, isUnique: ButtonStates.idle as number });

    const form2 = ref(null);
    const valid2 = ref(true);

    watch(variableName, (val) => {
      states.value.isUnique = ButtonStates.progress;
      getSocket('/core/customvariables').emit('customvariables::isUnique', { variable: val, id: id.value }, (err: string | null, isUnique: boolean) => {
        if (err) {
          EventBus.$emit('snack', 'error', err);
          return;
        }
        if (!isUnique) {
          states.value.isUnique = ButtonStates.fail;
        } else {
          states.value.isUnique = ButtonStates.success;
        }
      });
    });

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

    const availableRunEvery = [
      {
        seconds: 0, text: translate('registry.customvariables.runEvery.isUsed'), value: 'isUsed',
      },
      {
        seconds: 1000, text: translate('registry.customvariables.runEvery.seconds'), value: 'seconds',
      },
      {
        seconds: 1000 * 60, text: translate('registry.customvariables.runEvery.minutes'), value: 'minutes',
      },
      {
        seconds: 1000 * 60 * 60, text: translate('registry.customvariables.runEvery.hours'), value: 'hours',
      },
      {
        seconds: 1000 * 60 * 60 * 24, text: translate('registry.customvariables.runEvery.days'), value: 'days',
      },
    ];

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
      variableNameDirty.value = true;
      if (isVariableNameValid.value === true && (form2.value as unknown as HTMLFormElement).validate()) {
        newItemSaving.value = true;
        await new Promise(() => {
          const item: VariableInterface = {
            id:                id.value,
            variableName:      variableName.value,
            history:           history.value,
            currentValue:      currentValue.value,
            urls:              urls.value,
            permission:        permission.value,
            readOnly:          readOnly.value,
            usableOptions:     usableOptions.value,
            runAt:             runAt.value,
            type:              type.value,
            description:       description.value,
            responseType:      responseType.value,
            evalValue:         evalValue.value,
            runEveryType:      runEveryType.value,
            runEveryTypeValue: availableRunEvery.find(o => o.value === runEveryType.value)?.seconds ?? 0,
            runEvery:          (() => {
              const value = availableRunEvery.find(o => o.value === runEveryType.value)?.seconds ?? 0;
              return Number(runEveryX.value * value);
            })(),
          };
          console.log('Saving', { item });
          getSocket('/core/customvariables').emit('customvariables::save', item, () => {
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
        variableNameDirty.value = true;
      }
      if (e1.value === 2) {
        (form2.value as unknown as HTMLFormElement).validate();
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

    const testScript = () => {
      states.value.test = ButtonStates.progress;
      getSocket('/core/customvariables').emit('customvariables::testScript', { evalValue: evalValue.value, currentValue: currentValue.value }, (err: string | null, response: string) => {
        states.value.test = ButtonStates.idle;
        if (err) {
          EventBus.$emit('snack', 'error', err);
        } else {
          currentValue.value = response;
        }
      });
    };

    return {
      theme,
      variableName,
      evalValue,
      type,
      currentValue,
      newItem,
      optionSearch,
      runEveryX,
      runEveryType,
      e1,
      translate,
      newItemSaving,
      form2,
      valid2,
      closeDlg,
      validateForm,

      availableTypes,
      availableValues,
      availableRunEvery,
      setCurrentValueOption,
      removeOption,

      mdiDelete,
      ButtonStates,
      states,
      testScript,
      computedRules,
      isVariableNameValid,
      variableNameDirty,
    };
  },
});
</script>
