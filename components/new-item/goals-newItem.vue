<template>
  <v-dialog v-model="dialog" fullscreen>
    <template v-if="activator" #activator="{ on, attrs }">
      <slot v-bind="attrs" v-on="on">
        <v-btn color="primary" v-bind="attrs" v-on="on">
          New Item
        </v-btn>
      </slot>
    </template>

    <v-card :loading="isLoading">
      <v-toolbar dense color="dark">
        <v-btn icon @click="dialog = false">
          <v-icon>{{ mdiClose }}</v-icon>
        </v-btn>
        <span v-if="!$route.query._id" class="headline">New Item</span>
        <span v-else class="headline">Edit Item</span>
        <v-spacer />
        <v-btn text :loading="isSaving" :disabled="!valid1 || !valid2" @click="save">
          {{ translate('dialog.buttons.saveChanges.idle') }}
        </v-btn>
      </v-toolbar>

      <v-stepper v-model="stepper" vertical dark class="transparent" elevation="0">
        <v-stepper-step :complete="stepper > 1" step="1" editable :rules="[() => valid1]">
          {{ translate('registry.goals.groupSettings') }}
        </v-stepper-step>
        <v-stepper-content :step="1">
          <v-form ref="form1" v-model="valid1" lazy-validation>
            <v-text-field
              v-model="item.name"
              :rules="rules.name"
              :label="translate('registry.goals.input.nameGroup.title')"
            />

            <v-select
              v-model="item.display.type"
              :label="translate('registry.goals.input.displayAs.title')"
              :items="groupType"
              :hint="translate('registry.goals.input.displayAs.help')"
            />

            <template v-if="item.display.type === 'multi'">
              <v-text-field
                v-model="item.display.spaceBetweenGoalsInPx"
                :hint="translate('registry.goals.input.spaceBetweenGoalsInPx.help')"
                :rules="rules.spaceBetweenGoalsInPx"
                :label="translate('registry.goals.input.spaceBetweenGoalsInPx.title')"
              >
                <template #append>
                  px
                </template>
              </v-text-field>
            </template>

            <template v-if="item.display.type === 'fade'">
              <v-text-field
                v-model="item.display.durationMs"
                :hint="translate('registry.goals.input.durationMs.help')"
                :rules="rules.durationMs"
                :label="translate('registry.goals.input.durationMs.title')"
              >
                <template #append>
                  ms
                </template>
              </v-text-field>

              <v-text-field
                v-model="item.display.animationInMs"
                :hint="translate('registry.goals.input.animationInMs.help')"
                :rules="rules.animationInMs"
                :label="translate('registry.goals.input.animationInMs.title')"
              >
                <template #append>
                  ms
                </template>
              </v-text-field>

              <v-text-field
                v-model="item.display.animationOutMs"
                :hint="translate('registry.goals.input.animationOutMs.help')"
                :rules="rules.animationOutMs"
                :label="translate('registry.goals.input.animationOutMs.title')"
              >
                <template #append>
                  ms
                </template>
              </v-text-field>
            </template>
          </v-form>
        </v-stepper-content>

        <v-stepper-step :complete="stepper > 2" step="2" editable :rules="[() => valid2]">
          {{ translate('registry.goals.goals') }}
        </v-stepper-step>
        <v-stepper-content :step="2">
          <v-form ref="form2" v-model="valid2" lazy-validation>
            <v-row no-gutters>
              <v-col cols="11">
                <v-tabs ref="tabs" v-model="selectedTab" show-arrows center-active>
                  <v-tab v-for="goal of item.goals" :key="goal.id">
                    <span :class="{'red--text': hasError(goal.id)}">
                      <v-icon v-if="hasError(goal.id)" color="red">{{ mdiExclamationThick }}</v-icon>
                      <span v-if="goal.name.trim().length === 0">
                        &lt;untitled&gt;
                      </span>
                      <span v-else>
                        {{ goal.name }}
                      </span>
                    </span>
                  </v-tab>
                </v-tabs>
              </v-col>
              <v-col cols="1" class="text-center" align-self="center">
                <v-btn icon @click="addItem">
                  <v-icon>{{ mdiPlus }}</v-icon>
                </v-btn>
              </v-col>
            </v-row>

            <v-tabs-items v-model="selectedTab">
              <v-tab-item v-for="goal of item.goals" :key="goal.id + 'tabContent'">
                <v-card flat>
                  <v-card-text>
                    <v-text-field
                      :id="goal.id + '|name'"
                      v-model="goal.name"
                      :rules="rules.name"
                      :label="translate('registry.goals.input.name.title')"
                      @change="updateTabWidth"
                      @input="updateTabWidth"
                    />

                    <v-divider class="py-2" />

                    <v-expansion-panels>
                      <v-expansion-panel>
                        <v-expansion-panel-header>
                          Goal settings
                        </v-expansion-panel-header>
                        <v-expansion-panel-content>
                          <v-select
                            v-model="goal.type"
                            :label="translate('registry.goals.input.type.title')"
                            :items="goalType"
                          />

                          <v-checkbox
                            v-if="goal.type === 'tips'"
                            v-model="goal.countBitsAsTips"
                            :label="translate('registry.goals.input.countBitsAsTips.title')"
                          />

                          <v-text-field
                            :id="goal.id + '|goalAmount'"
                            v-model="goal.goalAmount"
                            :rules="rules.goalAmount"
                            :label="translate('registry.goals.input.goalAmount.title')"
                          />

                          <v-text-field
                            v-if="!goal.type.includes('current')"
                            :id="goal.id + '|currentAmount'"
                            v-model="goal.currentAmount"
                            :rules="rules.currentAmount"
                            :label="translate('registry.goals.input.currentAmount.title')"
                          />

                          <v-checkbox
                            v-model="goal.endAfterIgnore"
                            :label="translate('registry.goals.input.endAfterIgnore.title')"
                          />
                          <v-expand-transition>
                            <div v-if="!goal.endAfterIgnore">
                              <v-subheader class="pa-0" style="font-size: 12px;">
                                {{ translate('registry.goals.input.endAfter.title') }}
                              </v-subheader>
                              <datetime :input.sync="goal.endAfter" />
                            </div>
                          </v-expand-transition>
                        </v-expansion-panel-content>
                      </v-expansion-panel>
                      <v-expansion-panel>
                        <v-expansion-panel-header>Display Settings</v-expansion-panel-header>
                        <v-expansion-panel-content>
                          <v-select
                            v-model="goal.display"
                            :label="translate('registry.goals.display')"
                            :items="displayType"
                          />
                          <v-expand-transition>
                            <div v-if="goal.display === 'custom'">
                              <v-tabs v-model="customTab">
                                <v-tab>HTML</v-tab>
                                <v-tab>JS</v-tab>
                                <v-tab>CSS</v-tab>
                              </v-tabs>
                              <v-tabs-items v-model="customTab">
                                <v-tab-item>
                                  <codemirror
                                    v-model="goal.customizationHtml"
                                    class="w-100"
                                    :options="{
                                      tabSize: 4,
                                      mode: 'text/html',
                                      theme: 'base16-dark',
                                      lineNumbers: true,
                                      line: true,
                                    }"
                                  />
                                </v-tab-item>
                                <v-tab-item>
                                  <codemirror
                                    v-model="goal.customizationJs"
                                    class="w-100"
                                    :options="{
                                      tabSize: 4,
                                      mode: 'text/javascript',
                                      theme: 'base16-dark',
                                      lineNumbers: true,
                                      line: true,
                                    }"
                                  />
                                </v-tab-item>
                                <v-tab-item>
                                  <codemirror
                                    v-model="goal.customizationCss"
                                    class="w-100"
                                    :options="{
                                      tabSize: 4,
                                      mode: 'text/css',
                                      theme: 'base16-dark',
                                      lineNumbers: true,
                                      line: true,
                                    }"
                                  />
                                </v-tab-item>
                              </v-tabs-items>
                            </div>
                          </v-expand-transition>
                        </v-expansion-panel-content>
                      </v-expansion-panel>
                      <v-expansion-panel>
                        <v-expansion-panel-header>
                          {{ translate('registry.goals.fontSettings') }}
                        </v-expansion-panel-header>
                        <v-expansion-panel-content>
                          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
                          labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
                          laboris nisi ut aliquip ex ea commodo consequat.
                        </v-expansion-panel-content>
                      </v-expansion-panel>
                      <v-expansion-panel>
                        <v-expansion-panel-header>
                          {{ translate('registry.goals.barSettings') }}
                        </v-expansion-panel-header>
                        <v-expansion-panel-content>
                          <v-row>
                            <v-col cols="3">
                              <v-text-field
                                :id="goal.id + '|borderPx'"
                                v-model="goal.customizationBar.borderPx"
                                type="number"
                                min="0"
                                :hint="translate('registry.goals.input.borderPx.help')"
                                :rules="rules.borderPx"
                                :label="translate('registry.goals.input.borderPx.title')"
                              >
                                <template #append>
                                  px
                                </template>
                              </v-text-field>
                            </v-col>
                            <v-col cols="3">
                              <v-text-field
                                :id="goal.id + '|barHeight'"
                                v-model="goal.customizationBar.height"
                                min="1"
                                :hint="translate('registry.goals.input.barHeight.help')"
                                type="number"
                                :rules="rules.barHeight"
                                :label="translate('registry.goals.input.barHeight.title')"
                              >
                                <template #append>
                                  px
                                </template>
                              </v-text-field>
                            </v-col>
                            <v-col cols="6">
                              <color :id="goal.id + '|color'" v-model="goal.customizationBar.color" :label="translate('registry.goals.input.color.title')" :rules="rules.color" />
                              <color :id="goal.id + '|borderColor'" v-model="goal.customizationBar.borderColor" :label="translate('registry.goals.input.borderColor.title')" :rules="rules.color" />
                              <color :id="goal.id + '|backgroundColor'" v-model="goal.customizationBar.backgroundColor" :label="translate('registry.goals.input.backgroundColor.title')" :rules="rules.color" />
                            </v-col>
                          </v-row>
                        </v-expansion-panel-content>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer />
                    <v-btn color="error" @click="removeItem(goal)">
                      Remove
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-tab-item>
            </v-tabs-items>
          </v-form>
        </v-stepper-content>
      </v-stepper>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import {
  mdiClose, mdiExclamationThick, mdiPlus,
} from '@mdi/js';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineAsyncComponent,
  defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';
import { cloneDeep } from 'lodash-es';
import { v4 } from 'uuid';
import { codemirror } from 'vue-codemirror';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/mode/htmlmixed/htmlmixed.js';
import 'codemirror/mode/css/css.js';
import 'codemirror/theme/base16-dark.css';
import 'codemirror/lib/codemirror.css';

import { GoalGroupInterface, GoalInterface } from '~/.bot/src/bot/database/entity/goal';
import api from '~/functions/api';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import {
  isHexColor, minValue, required,
} from '~/functions/validators';

type Props = {
  editItem?: GoalGroupInterface, activator: boolean
};

const emptyItem: GoalGroupInterface = {
  goals:     [],
  createdAt: Date.now(),
  name:      '',
  display:   {
    type:           'fade',
    durationMs:     60000,
    animationInMs:  1000,
    animationOutMs: 1000,
  },
};

export default defineComponent({
  components: {
    codemirror,
    datetime: defineAsyncComponent({ loader: () => import('~/components/datetime.vue') }),
    color:    defineAsyncComponent({ loader: () => import('~/components/form/color.vue') }),
  },
  props: { editItem: Object, activator: Boolean },
  setup (props: Props, ctx) {
    const dialog = ref(
      (!props.activator && ctx.root.$route.query._action === 'create')
      || (props.activator && typeof ctx.root.$route.query._id !== 'undefined'),
    );
    const stepper = ref(1);

    const form1 = ref(null);
    const valid1 = ref(true);
    const form2 = ref(null);
    const valid2 = ref(true);
    const tabs = ref(null as null | HTMLElement);

    const isSaving = ref(false);
    const isLoading = ref(false);

    const selectedTab = ref(0);
    const customTab = ref(0);

    const item = ref(cloneDeep(props.editItem ? props.editItem : emptyItem) as GoalGroupInterface);

    const groupType = ['fade', 'multi'];
    const goalType = ['followers', 'currentFollowers', 'currentSubscribers', 'subscribers', 'tips', 'bits'];
    const displayType = ['simple', 'full', 'custom'];

    const rules = {
      name:                  [required],
      spaceBetweenGoalsInPx: [required, minValue(0)],
      goalAmount:            [required, minValue(1)],
      borderPx:              [required, minValue(0)],
      barHeight:             [required, minValue(1)],
      color:                 [required, isHexColor],
      currentAmount:         [required, minValue(0)],
      durationMs:            [required, minValue(1000)],
      animationInMs:         [required, minValue(1000)],
      animationOutMs:        [required, minValue(1000)],
    };

    watch(dialog, (val) => {
      if (val) {
        stepper.value = 1;
      }

      if (val && props.activator) {
        isLoading.value = false;
        ctx.root.$router.push({ query: { _action: 'create' } });
        item.value = cloneDeep({
          ...emptyItem,
          createdAt: Date.now(),
        });
      } else {
        ctx.root.$router.push({ query: {} });
      }
    });

    watch(() => item.value.display.type, (val, old) => {
      if (val === old) {
        return;
      }
      switch (val) {
        case 'fade':
          item.value = {
            ...item.value,
            display: {
              type:           'fade',
              durationMs:     60000,
              animationInMs:  1000,
              animationOutMs: 1000,
            },
          };
          break;
        case 'multi':
          item.value = {
            ...item.value,
            display: {
              type:                  'multi',
              spaceBetweenGoalsInPx: 0,
            },
          };
          break;
      }
    });

    onMounted(() => {
      if (!props.activator) {
        // eventbus to activate dialog
        EventBus.$on('goals::updateDlgShow', (updateItem: GoalGroupInterface) => {
          dialog.value = true;
          item.value = cloneDeep(updateItem);
          isLoading.value = false;
          ctx.root.$nextTick(() => {
            ctx.root.$router.replace({ query: { _id: updateItem.id ?? '' } });
          });
        });
      }

      if (ctx.root.$route.query._id) {
        // load initial item
        isLoading.value = true;
        api.getOne<GoalGroupInterface>(ctx.root.$axios, `/api/v1/registry/goals/`, String(ctx.root.$route.query._id) ?? '')
          .then((response) => {
            item.value = response.data;
            isLoading.value = false;
          })
          .catch(() => {
            dialog.value = false;
            ctx.root.$router.push({ query: {} });
            EventBus.$emit('snack', 'error', 'Data not found.');
          });
      }
    });

    const addItem = () => {
      item.value = {
        ...item.value,
        goals: [
          ...item.value.goals,
          {
            id:   v4(),
            name: '',
            type: 'followers',

            display: 'full',

            customizationBar: {
              color:           '#00aa00',
              backgroundColor: '#e9ecef',
              borderColor:     '#000000',
              borderPx:        0,
              height:          50,
            },
            customizationFont: {
              family:      'PT Sans',
              weight:      500,
              color:       '#ffffff',
              size:        20,
              borderColor: '#000000',
              borderPx:    1,
              shadow:      [],
            },
            customizationHtml: '\n\t<!-- '
                + '\n\t\tAll html objects will be wrapped in the #wrap div'
                + '\n\t\tBootstrap classes are available'
                + '\n\t\tAvailable variables:'
                  + '\n\t\t\t$name - name of goal ; $type - type of goal ; $goalAmount - total amount'
                  + '\n\t\t\t$currentAmount - current amount ; $percentageAmount - how much is achieved ; $endAfter - when goal ends'
              + '\n\t-->'
              + '\n'
              + '\n\t<div class="row no-gutters">'
                + '\n\t\t<div class="col-4 text-left text-nowrap pl-2 pr-2">$name</div>'
                + '\n\t\t<div class="col-4 text-nowrap text-center">$currentAmount</div>'
                + '\n\t\t<div class="col-4 text-nowrap text-right pr-2">$goalAmount</div>'
              + '\n\t</div>'
              + '\n'
              + '\n\t<div class="progress">'
                + '\n\t\t<div class="progress-bar" role="progressbar" style="width: $percentageAmount%" aria-valuenow="$percentageAmount" aria-valuemin="0" aria-valuemax="$goalAmount"></div>'
              + '\n\t</div>'
              + '\n',
            customizationJs: '\n\tfunction onChange(currentAmount) {'
                + '\n\t\tconsole.log(\'new value is \' + currentAmount);'
              + '\n\t}'
              + '\n',
            customizationCss: '\n\t/* All html objects will be wrapped in the #wrap div */'
              + '\n\n\t#wrap .progress-bar {'
                + '\n\t\tbackground: black;'
              + '\n\t}'
              + '\n',
            timestamp:       Date.now(),
            goalAmount:      1000,
            currentAmount:   0,
            endAfter:        Date.now() + 24 * 60 * 60 * 1000,
            endAfterIgnore:  true,
            countBitsAsTips: false,
          }],
      };
      selectedTab.value = item.value.goals.length - 1;
    };

    const removeItem = (goal: GoalInterface) => {
      item.value = {
        ...item.value,
        goals: item.value.goals.filter(o => o.id !== goal.id),
      };
    };

    const save = () => {
      if (
        (form1.value as unknown as HTMLFormElement).validate()
        && (form2.value as unknown as HTMLFormElement).validate()
      ) {
        isSaving.value = true;
        api.patch(ctx.root.$axios, `/api/v1/registry/goals/${item.value.id ?? v4()}`, item.value)
          .then((response) => {
            console.log({ response });
            ctx.root.$router.replace({ query: { _id: response.id ?? '' } });
            EventBus.$emit('snack', 'success', 'Data saved.');
            EventBus.$emit('goals::refresh');
          })
          .catch((e) => {
            console.error(e.response.data);
            error(JSON.stringify(e.response.data));
          })
          .finally(() => (isSaving.value = false));
      }
      updateTabWidth();
    };

    const closeDlg = () => {
      ctx.emit('close');
    };

    const hasError = (id: string) => {
      if (form2.value) {
        const inputs = (form2.value as unknown as any).inputs.filter((o: any) => {
          return (o.id ?? '').split('|')[0] === id;
        }).map((o: any) => o._uid);
        const errors = Object.entries((form2.value as unknown as any).errorBag).filter(o => o[1]).map(o => Number(o[0]));
        for (const input of inputs) {
          if (errors.includes(input)) {
            return true;
          }
        }
        return false;
      }
    };

    const updateTabWidth = () => {
      if (tabs.value) {
        (tabs.value as any).callSlider();
      }
    };

    return {
      // refs
      dialog,
      isSaving,
      isLoading,
      closeDlg,
      form1,
      valid1,
      form2,
      valid2,
      item,
      stepper,
      displayType,
      groupType,
      goalType,
      rules,
      customTab,
      selectedTab,
      tabs,

      // functions
      save,
      addItem,
      removeItem,
      hasError,
      updateTabWidth,

      // others
      translate,

      // icons
      mdiClose,
      mdiPlus,
      mdiExclamationThick,
    };
  },
});
</script>
