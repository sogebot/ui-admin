<template>
  <v-card :loading="loading">
    <portal to="navbar">
      <v-btn
        small
        :text="!$vuetify.breakpoint.xs"
        :icon="$vuetify.breakpoint.xs"
        :loading="saving"
        :disabled="!valid1 || !valid2 || loading"
        @click="save"
      >
        <v-icon class="d-flex d-sm-none">
          {{ mdiFloppy }}
        </v-icon>
        <span class="d-none d-sm-flex">{{ translate('dialog.buttons.saveChanges.idle') }}</span>
      </v-btn>
    </portal>

    <v-stepper
      v-if="!loading"
      v-model="stepper"
      vertical
      dark
      class="transparent"
      elevation="0"
    >
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
              <v-fade-transition leave-absolute>
                <v-alert v-if="item.goals.length === 0" text color="info" border="left" class="ma-0">
                  There are no goals.
                  Create a new goal using the <b>+</b> button on the right.
                </v-alert>
                <v-tabs v-else ref="tabs" v-model="selectedTab" show-arrows center-active>
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
              </v-fade-transition>
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

                        <v-expand-transition>
                          <v-checkbox
                            v-if="['tips', 'intervalTips'].includes(goal.type)"
                            v-model="goal.countBitsAsTips"
                            :label="translate('registry.goals.input.countBitsAsTips.title')"
                          />
                        </v-expand-transition>

                        <v-expand-transition>
                          <v-select
                            v-if="goal.type.includes('interval')"
                            v-model="goal.interval"
                            :label="translate('registry.goals.input.interval.title')"
                            :items="intervalItems"
                          />
                        </v-expand-transition>
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
                          :readonly="goal.type.includes('interval')"
                          :rules="rules.currentAmount"
                          :label="translate('registry.goals.input.currentAmount.title')"
                        />

                        <v-checkbox
                          v-model="goal.endAfterIgnore"
                          :label="translate('registry.goals.input.endAfterIgnore.title')"
                        />
                        <v-expand-transition>
                          <div v-show="!goal.endAfterIgnore">
                            <datetime v-model.number="goal.endAfter" :label="translate('registry.goals.input.endAfter.title')" />
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
                                <prism-editor
                                  v-model="goal.customizationHtml"
                                  style="border: 1px solid gray;"
                                  line-numbers
                                  :tab-size="4"
                                  :highlight="highlighterHTML"
                                />
                              </v-tab-item>
                              <v-tab-item>
                                <prism-editor
                                  v-model="goal.customizationJs"
                                  style="border: 1px solid gray;"
                                  line-numbers
                                  :tab-size="4"
                                  :highlight="highlighterJS"
                                />
                              </v-tab-item>
                              <v-tab-item>
                                <prism-editor
                                  v-model="goal.customizationCss"
                                  style="border: 1px solid gray;"
                                  line-numbers
                                  :tab-size="4"
                                  :highlight="highlighterCSS"
                                />
                              </v-tab-item>
                            </v-tabs-items>
                          </div>
                        </v-expand-transition>
                      </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel :disabled="goal.display === 'custom'">
                      <v-expansion-panel-header>
                        {{ translate('registry.goals.fontSettings') }}
                      </v-expansion-panel-header>
                      <v-expansion-panel-content>
                        <font :id="goal.id" v-model="goal.customizationFont" />
                      </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel :disabled="goal.display === 'custom'">
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
                            <color :id="goal.id + '|color'" v-model="goal.customizationBar.color" :label="translate('registry.goals.input.color.title')" />
                            <color :id="goal.id + '|borderColor'" v-model="goal.customizationBar.borderColor" :label="translate('registry.goals.input.borderColor.title')" />
                            <color :id="goal.id + '|backgroundColor'" v-model="goal.customizationBar.backgroundColor" :label="translate('registry.goals.input.backgroundColor.title')" />
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
    <v-overlay v-else>
      <v-row>
        <v-col class="text-center">
          <v-progress-circular indeterminate size="48" />
        </v-col>
      </v-row>
    </v-overlay>
  </v-card>
</template>

<script lang="ts">
import {
  mdiClose, mdiExclamationThick, mdiFloppy, mdiPlus,
} from '@mdi/js';
import {
  defineAsyncComponent, defineComponent, onMounted,

  ref, useRoute, useRouter, useStore, watch,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';
import {
  useMutation, useQuery, useResult,
} from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { cloneDeep } from 'lodash';
import { v4 } from 'uuid';

import { GoalGroupInterface, GoalInterface } from '~/.bot/src/database/entity/goal';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import {
  highlighterCSS, highlighterHTML, highlighterJS, PrismEditor,
} from '~/functions/prismjs';
import { minValue, required } from '~/functions/validators';
import GET_ONE from '~/queries/goals/getOne.gql';

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
    PrismEditor,
    datetime: defineAsyncComponent({ loader: () => import('~/components/form/datetime.vue') }),
    color:    defineAsyncComponent({ loader: () => import('~/components/form/color.vue') }),
    font:     defineAsyncComponent({ loader: () => import('~/components/form/expansion/font.vue') }),
  },
  setup () {
    const route = useRoute();
    const store = useStore();
    const stepper = ref(1);
    const router = useRouter();

    let loading = ref(true);
    const item = ref(cloneDeep(emptyItem) as GoalGroupInterface);
    if (route.value.params.id !== 'new') {
      const query = useQuery(GET_ONE, { id: route.value.params.id });
      query.onError(error);
      loading = query.loading;
      const cache = useResult<{ goals: GoalGroupInterface[] }, null>(query.result, null);
      watch(cache, (value) => {
        if (!value) {
          return;
        }

        if (value.length === 0) {
          EventBus.$emit('snack', 'error', 'Data not found.');
          router.push({ path: '/registry/goals' });
        } else {
          item.value = cloneDeep(value[0]);
        }
      }, { immediate: true, deep: true });
    } else {
      loading.value = false;
    }
    const { mutate: saveMutation, loading: saving, onDone: onDoneSave, onError: onErrorSave } = useMutation(gql`
      mutation goalsSave($data_json: String!) {
        goalsSave(data: $data_json) { id }
      }`);
    onDoneSave((result) => {
      router.push({ params: { id: result.data.goalsSave.id } });
      EventBus.$emit('snack', 'success', 'Data saved.');
    });
    onErrorSave(error);

    const form1 = ref(null);
    const valid1 = ref(true);
    const form2 = ref(null);
    const valid2 = ref(true);
    const tabs = ref(null as null | HTMLElement);

    const selectedTab = ref(0);
    const customTab = ref(0);

    const intervalItems = ['hour', 'day', 'week', 'month', 'year'];
    const groupType = ['fade', 'multi'];
    const goalType = [
      'followers', 'currentFollowers', 'currentSubscribers', 'subscribers',
      'tips', 'bits', 'intervalSubscribers', 'intervalFollowers', 'intervalTips', 'intervalBits'];
    const displayType = ['simple', 'full', 'custom'];

    const rules = {
      name:                  [required],
      spaceBetweenGoalsInPx: [required, minValue(0)],
      goalAmount:            [required, minValue(1)],
      borderPx:              [required, minValue(0)],
      barHeight:             [required, minValue(1)],
      currentAmount:         [required, minValue(0)],
      durationMs:            [required, minValue(1000)],
      animationInMs:         [required, minValue(1000)],
      animationOutMs:        [required, minValue(1000)],
    };

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
      store.commit('panel/back', '/registry/goals');
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
              + '\n\t<div>'
                + '\n\t\t<div class="progress-bar" style="width: $percentageAmount%; height: 24px;"></div>'
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
            interval:        'hour',
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
        saveMutation({
          data_json: JSON.stringify({
            ...item.value,
            id: item.value.id ?? v4(),
          }),
        });
      }
      updateTabWidth();
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

    const goBack = () => {
      router.push({ path: '/registry/goals' });
    };

    return {
      // refs
      saving,
      loading,
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
      intervalItems,

      // functions
      save,
      addItem,
      removeItem,
      hasError,
      updateTabWidth,
      goBack,

      // others
      translate,
      highlighterJS,
      highlighterCSS,
      highlighterHTML,

      // icons
      mdiClose,
      mdiPlus,
      mdiExclamationThick,
      mdiFloppy,
    };
  },
});
</script>
