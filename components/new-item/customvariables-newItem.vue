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

      <v-divider />

      <v-stepper-step
        :complete="e1 > 2"
        step="2"
        editable
        :rules="[() => valid2]"
      >
        Set type and value
      </v-stepper-step>

      <v-divider />

      <v-stepper-step
        :complete="e1 > 3"
        step="3"
        editable
      >
        REST access
        <small>Optional</small>
      </v-stepper-step>

      <v-divider />

      <v-stepper-step
        :complete="e1 > 4"
        step="4"
        editable
      >
        Settings
        <small>Optional</small>
      </v-stepper-step>
    </v-stepper-header><v-stepper-items>
      <v-stepper-content :step="1">
        <v-text-field
          v-model="variableName"
          :label="translate('registry.customvariables.variable.name')"
          :hint="translate('registry.customvariables.variable.help')"
          :error="typeof isVariableNameValid === 'string'"
          :error-messages="typeof isVariableNameValid === 'string' ? [isVariableNameValid] : []"
          hide-details="auto"
          required
          counter
          @input="variableNameDirty = true"
        >
          <template #append>
            <v-progress-circular v-if="states.isUnique === ButtonStates.progress" size="18" indeterminate />
          </template>
        </v-text-field>

        <v-text-field
          v-model="description"
          :label="translate('registry.customvariables.description.name')"
          :hint="translate('registry.customvariables.description.help')"
          counter
        />
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
                  <v-icon>mdi-delete-forever</v-icon>
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
            <prism-editor
              v-model="evalValue"
              line-numbers
              :tab-size="4"
              :highlight="highlighterJS"
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

            <v-col cols="12">
              <v-subheader class="pl-0">
                {{ translate('registry.customvariables.run-script') }}:
                <template v-if="runEvery === 0">
                  {{ translate('registry.customvariables.runEvery.isUsed') }}
                </template>
                <template v-else>
                  {{ humanizeDuration(runEvery) }}
                </template>
              </v-subheader>
              <v-slider
                v-model="runEvery"
                :max="7 * DAY"
                :step="30000"
              />
            </v-col>
          </template>
        </v-form>
      </v-stepper-content>

      <v-stepper-content step="3">
        <v-data-table
          dense
          :items="urls"
          :headers="urlsHeaders"
          :items-per-page="-1"
        >
          <template #top>
            <v-sheet
              flat
              color="dark"
            >
              <v-row no-gutters>
                <v-col cols="auto" align-self="center">
                  <v-btn @click="generateURL">
                    {{ translate('registry.customvariables.generateurl') }}
                  </v-btn>
                </v-col>
              </v-row>
            </v-sheet>
          </template>
          <template #[`item.GET`]="{ item }">
            <v-simple-checkbox
              v-model="item.GET"
            />
          </template>
          <template #[`item.POST`]="{ item }">
            <v-simple-checkbox
              v-model="item.POST"
            />
          </template>
          <template #[`item.showResponse`]="{ item }">
            <v-simple-checkbox
              v-model="item.showResponse"
            />
          </template>
          <template #[`item.link`]="{ item }">
            {{ origin }}/customvariables/{{ item.id }}
          </template>

          <template #[`item.actions`]="{ item }">
            <div style="width: max-content;">
              <v-hover v-slot="{ hover }">
                <v-btn
                  icon
                  :color="hover ? 'primary' : 'secondary lighten-3'"
                  :href="`/customvariables/${item.id}`"
                >
                  <v-icon>mdi-link</v-icon>
                </v-btn>
              </v-hover>
              <v-hover v-slot="{ hover }">
                <v-btn
                  icon
                  :color="hover ? 'red' : 'secondary lighten-3'"
                  @click="removeURL(item.id)"
                >
                  <v-icon>mdi-delete-forever</v-icon>
                </v-btn>
              </v-hover>
            </div>
          </template>
        </v-data-table>
      </v-stepper-content>

      <v-stepper-content step="4">
        <v-select
          v-model="permission"
          class="ma-2"
          :label="translate('permission')"
          :items="permissionItems"
        />

        <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
          <h5 style="font-weight: normal;">
            {{ translate('registry.customvariables.response.name') }}
          </h5>
          <v-radio-group v-model="responseType">
            <v-radio
              key="responseType-0"
              :label="translate('registry.customvariables.response.default')"
              :value="0"
            />
            <v-radio
              key="responseType-1"
              :label="translate('registry.customvariables.response.custom')"
              :value="1"
              @click="responseText = ''"
            />
            <v-radio
              key="responseType-2"
              :label="translate('registry.customvariables.response.command') + ' - ' + translate('registry.customvariables.useIfInCommand')"
              :value="2"
              @click="responseText = ''"
            />
          </v-radio-group>

          <v-text-field
            v-if="responseType === 1"
            v-model="responseText"
            :label="translate('registry.customvariables.response.default-placeholder')"
            counter
          />
        </v-container>
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
          v-if="e1 < 4"
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
import type { PermissionsInterface } from '@entity/permissions';
import type { VariableInterface } from '@entity/variable';
import {
  computed,
  defineComponent, onMounted, ref, watch,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { DAY } from '@sogebot/ui-helpers/constants';
import { defaultPermissions } from '@sogebot/ui-helpers/permissions/defaultPermissions';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import humanizeDuration from 'humanize-duration';
import { v4 } from 'uuid';

import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { origin } from '~/functions/origin';
import { highlighterJS, PrismEditor } from '~/functions/prismjs';
import { minValue, required } from '~/functions/validators';

type Props = {
  rules: Record<string, any[]>,
  item: null | VariableInterface,
};

export default defineComponent({
  components: { PrismEditor },
  props:      { rules: Object, item: Object },
  setup (props: Props, ctx) {
    const permissions = ref([] as PermissionsInterface[]);
    const computedRules = {
      runEvery:     [required, minValue(0)],
      variableName: [
        ...props.rules.variableName,
        () => states.value.isUnique === ButtonStates.progress || states.value.isUnique === ButtonStates.success || translate('registry.customvariables.variable.error.isNotUnique'),
      ],
    };

    const isVariableNameValid = computed(() => {
      if (variableNameDirty.value) {
        for (const validator of computedRules.variableName) {
          const validated = validator(variableName.value);
          if (typeof validated === 'string') {
            return validated;
          }
        }
      }
      return true;
    });

    const e1 = ref(1);
    const newItemSaving = ref(false);

    const permissionItems = computed(() => {
      return permissions.value.map(item => ({
        text:     item.name,
        value:    item.id,
        disabled: false,
      }));
    });

    const id = ref(props.item ? props.item.id : v4());
    const variableName = ref(props.item ? props.item.variableName : '');
    const variableNameDirty = ref(false);
    const urls = ref(props.item ? props.item.urls : [] as { id: string; showResponse: boolean; GET: boolean; POST: boolean }[]);
    const history = ref(props.item ? props.item.history : []);
    const currentValue = ref(props.item ? props.item.currentValue : '');
    const permission = ref(props.item ? props.item.permission : defaultPermissions.MODERATORS);
    const readOnly = ref(props.item ? props.item.readOnly : false);
    const usableOptions = ref(props.item ? props.item.usableOptions : []);
    const runAt = ref(props.item ? props.item.runAt : Date.now());
    const type = ref(props.item ? props.item.type : 'text');
    const description = ref(props.item ? props.item.description : '');
    const responseType = ref(props.item ? props.item.responseType : 0);
    const responseText = ref(props.item ? props.item.responseText : '');
    const evalValue = ref(props.item ? props.item.evalValue : '');
    const runEvery = ref(props.item ? (props.item.runEvery ?? 0) / (props.item.runEvery || 1) : 0);

    const optionSearch = ref('');

    const states = ref({ test: ButtonStates.idle as number, isUnique: ButtonStates.success as number });

    const form2 = ref(null);
    const valid2 = ref(true);

    watch(variableName, (val) => {
      states.value.isUnique = ButtonStates.progress;
      getSocket('/core/customvariables').emit('customvariables::isUnique', { variable: val, id: id.value ?? '' }, (err, isUnique: boolean) => {
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

    onMounted(() => {
      getSocket('/core/permissions').emit('generic::getAll', (err, res) => {
        if (err) {
          return console.error(err);
        }
        permissions.value = res;
      });
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
            id:            id.value,
            variableName:  variableName.value,
            history:       history.value,
            currentValue:  currentValue.value,
            urls:          (urls.value as any),
            permission:    permission.value,
            readOnly:      readOnly.value,
            usableOptions: usableOptions.value,
            runAt:         runAt.value,
            type:          type.value,
            description:   description.value,
            responseType:  responseType.value,
            responseText:  responseText.value,
            evalValue:     evalValue.value,
            runEvery:      runEvery.value,
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
      getSocket('/core/customvariables').emit('customvariables::testScript', { evalValue: evalValue.value, currentValue: currentValue.value }, (err, response: string) => {
        states.value.test = ButtonStates.idle;
        if (err) {
          EventBus.$emit('snack', 'error', err);
        } else {
          currentValue.value = response;
        }
      });
    };

    const urlsHeaders = [
      { value: 'GET', text: 'GET' }, { value: 'POST', text: 'POST' }, { value: 'showResponse', text: translate('registry.customvariables.response.show') }, { value: 'link', text: '' }, { value: 'actions', text: '' },
    ];

    const generateURL = () => {
      urls.value?.push({
        id:           v4(),
        showResponse: false,
        GET:          false,
        POST:         false,
      });
    };

    const removeURL = (urlId: string) => {
      urls.value = urls.value?.filter(o => o.id !== urlId);
    };

    return {
      variableName,
      evalValue,
      type,
      currentValue,
      newItem,
      optionSearch,
      runEvery,
      e1,
      translate,
      newItemSaving,
      form2,
      valid2,
      closeDlg,
      validateForm,
      permission,
      urls,
      generateURL,
      removeURL,
      description,
      responseType,
      responseText,

      availableTypes,
      availableValues,
      setCurrentValueOption,
      removeOption,

      ButtonStates,
      states,
      testScript,
      computedRules,
      isVariableNameValid,
      variableNameDirty,

      permissions,
      permissionItems,

      urlsHeaders,
      origin,
      highlighterJS,
      humanizeDuration,
      DAY,
    };
  },
});
</script>
