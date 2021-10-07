<template>
  <v-card :loading="loading" class="fill-height">
    <portal to="navbar">
      <v-btn
        small
        :text="!$vuetify.breakpoint.xs"
        :icon="$vuetify.breakpoint.xs"
        :loading="saving"
        :disabled="!valid1 || loading"
        @click="save"
      >
        <v-icon class="d-flex d-sm-none">
          {{ mdiFloppy }}
        </v-icon>
        <span class="d-none d-sm-flex">{{ translate('dialog.buttons.saveChanges.idle') }}</span>
      </v-btn>
    </portal>

    <v-fade-transition>
      <v-container v-if="!loading" fluid>
        <v-form ref="form1" v-model="valid1" lazy-validation>
          <v-text-field
            v-model.trim="item.name"
            :label="translate('registry.randomizer.form.name')"
            :rules="rules.name"
          />
          <v-text-field
            v-model.trim="item.command"
            :label="translate('registry.randomizer.form.command')"
            :rules="rules.command"
          />
          <v-select
            v-model="item.type"
            :label="translate('registry.randomizer.form.type')"
            :items="typeItems"
          />
          <v-select
            v-model="item.permissionId"
            :label="translate('registry.randomizer.form.permission')"
            :items="permissionItems"
          />

          <v-expand-transition>
            <div v-if="item.type === 'wheelOfFortune'">
              <v-checkbox v-model="item.shouldPlayTick" :label="translate('registry.randomizer.form.tick')" />
              <v-slider
                v-model="item.tickVolume"
                min="0"
                max="100"
                step="1"
                :label="translate('volume')"
                :thumb-size="0"
                thumb-label="always"
              >
                <template #thumb-label="{ value }">
                  <div style="transform: translateY(-8px);">
                    {{ Number(value) + '%' }}
                  </div>
                </template>
              </v-slider>
            </div>
          </v-expand-transition>
        </v-form>

        <v-expansion-panels :value="3">
          <position v-model="item.position" :disabled="item.type === 'wheelOfFortune'" :disable-x="item.type === 'tape'" :disable-anchor-x="item.type === 'tape'" :disable-anchor-y="item.type === 'tape'" />
          <tts v-model="item.tts" />
          <v-expansion-panel>
            <v-expansion-panel-header>
              {{ translate('registry.goals.fontSettings') }}
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <font v-model="item.customizationFont" />
            </v-expansion-panel-content>
          </v-expansion-panel>
          <v-expansion-panel>
            <v-expansion-panel-header v-slot="{open}">
              {{ translate('registry.randomizer.form.options') }}
              <div style="text-align: right;">
                <v-btn v-if="open" icon @click.stop="addOption">
                  <v-icon>{{ mdiPlus }}</v-icon>
                </v-btn>
              </div>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <options-table v-model="item.items" />
            </v-expansion-panel-content>
          </v-expansion-panel>
          <v-expansion-panel>
            <v-expansion-panel-header>
              {{ translate('registry.randomizer.form.probability') }}
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <div v-for="(uitem, index) of Array.from(new Set(item.items.map(o => o.name)))" :key="'probability' + index + uitem">
                {{ uitem }} &nbsp;
                <strong>{{ Number((generateItems(item.items).filter(o => o.name === uitem).length / generateItems(item.items).length) * 100).toFixed(2) }}%</strong>
              </div>
            </v-expansion-panel-content>
          </v-expansion-panel>
          <v-expansion-panel>
            <v-expansion-panel-header>
              {{ translate('registry.randomizer.form.generatedOptionsPreview') }}
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-alert v-if="generateItems(item.items).length === 0" text color="error">
                {{ translate('registry.randomizer.form.optionsAreEmpty') }}
              </v-alert>
              <div
                v-for="(item, index) of generateItems(item.items)"
                v-else
                :key="index + item.id"
                :style="{ color: getContrastColor(item.color), 'background-color': item.color, 'min-width': 'fit-content' }"
              >
                {{ item.name }}
              </div>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-container>
    </v-fade-transition>

    <v-overlay v-if="loading">
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
  computed, defineAsyncComponent, defineComponent, onMounted,

  ref,
  useRoute,
  useRouter, useStore, watch,
} from '@nuxtjs/composition-api';
import { getContrastColor, getRandomColor } from '@sogebot/ui-helpers/colors';
import { defaultPermissions } from '@sogebot/ui-helpers/permissions/defaultPermissions';
import translate from '@sogebot/ui-helpers/translate';
import {
  useMutation, useQuery, useResult,
} from '@vue/apollo-composable';
import gql from 'graphql-tag';
import {
  cloneDeep, isEqual, orderBy,
} from 'lodash';
import { v4 } from 'uuid';

import { PermissionsInterface } from '~/.bot/src/database/entity/permissions';
import { RandomizerInterface, RandomizerItemInterface } from '~/.bot/src/database/entity/randomizer';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import {
  minLength, required, startsWith,
} from '~/functions/validators';
import GET_ONE from '~/queries/randomizer/getOne.gql';

const emptyItem: RandomizerInterface = {
  id:             v4(),
  name:           '',
  command:        '',
  items:          [],
  createdAt:      Date.now(),
  permissionId:   defaultPermissions.CASTERS,
  isShown:        false,
  shouldPlayTick: false,
  tickVolume:     1,
  type:           'simple',
  widgetOrder:    -1,
  tts:            {
    enabled: false,
    voice:   'English Female',
    pitch:   1,
    volume:  0.5,
    rate:    1,
  },
  position: {
    x:       0,
    y:       0,
    anchorX: 'left',
    anchorY: 'top',
  },
  customizationFont: {
    family:      'PT Sans',
    weight:      500,
    size:        16,
    borderColor: '#000000',
    borderPx:    1,
    shadow:      [],
  },
};

export default defineComponent({
  components: {
    font:         defineAsyncComponent({ loader: () => import('~/components/form/expansion/font.vue') }),
    position:     defineAsyncComponent({ loader: () => import('~/components/form/expansion/position.vue') }),
    tts:          defineAsyncComponent({ loader: () => import('~/components/form/expansion/tts.vue') }),
    optionsTable: defineAsyncComponent({ loader: () => import('~/components/randomizer/table.vue') }),
  },
  setup () {
    const store = useStore();
    const route = useRoute();
    const router = useRouter();

    const item = ref(cloneDeep(emptyItem) as RandomizerInterface);

    const { result, loading } = useQuery(GET_ONE, { id: route.value.params.id });
    const permissions = useResult<{permissions: PermissionsInterface[] }, PermissionsInterface[], PermissionsInterface[]>(result, [], data => data.permissions);
    if (route.value.params.id !== 'new') {
      const cache = useResult<{ randomizers: RandomizerInterface[] }, null, RandomizerInterface[]>(result, null, data => data.randomizers);
      watch(cache, (value) => {
        if (!value) {
          return;
        }

        console.log({ value, item: item.value });
        if (value.length === 0) {
          EventBus.$emit('snack', 'error', 'Data not found.');
          router.push({ path: '/registry/randomizer' });
        } else {
          item.value = cloneDeep(value[0]);
        }
      }, { immediate: true, deep: true });
    }
    const { mutate: saveMutation, loading: saving, onDone: onDoneSave, onError: onErrorSave } = useMutation(gql`
      mutation randomizersSave($data_json: String!) {
        randomizersSave(data: $data_json) { id }
      }`);
    onDoneSave((res) => {
      router.push({ params: { id: res.data.randomizersSave.id } });
      EventBus.$emit('snack', 'success', 'Data saved.');
    });
    onErrorSave(error);

    const stepper = ref(1);

    const form1 = ref(null);
    const valid1 = ref(true);

    const typeItems = [
      { text: translate('registry.randomizer.form.simple'), value: 'simple' },
      { text: translate('registry.randomizer.form.wheelOfFortune'), value: 'wheelOfFortune' },
      { text: translate('registry.randomizer.form.tape'), value: 'tape' },
    ];
    const permissionItems = computed(() => {
      return permissions.value.map(o => ({
        text:     o.name,
        value:    o.id,
        disabled: false,
      }));
    });

    const rules = { name: [required], command: [required, startsWith(['!']), minLength(3)] };

    onMounted(() => {
      store.commit('panel/back', '/registry/randomizer/');
    });

    const save = () => {
      if (
        (form1.value as unknown as HTMLFormElement).validate()
      ) {
        saveMutation({ data_json: JSON.stringify(item.value) });
      }
    };

    const addOption = () => {
      if (item.value.items) {
        item.value.items.push({
          id:              v4(),
          name:            '',
          color:           getRandomColor(),
          numOfDuplicates: 1,
          minimalSpacing:  1,
          groupId:         null,
          randomizer:      undefined,
          randomizerId:    undefined,
          order:           item.value.items.length,
        });
      }
    };

    const generateItems = (items: Required<RandomizerItemInterface>[], generatedItems: Required<RandomizerItemInterface>[] = []) => {
      const beforeItems = cloneDeep(orderBy(items, 'order'));
      items = cloneDeep(orderBy(items, 'order'));
      items = items.filter(o => o.numOfDuplicates > 0);

      const countGroupItems = (item2: RandomizerItemInterface, count = 0): number => {
        const child = items.find(o => o.groupId === item2.id);
        if (child) {
          return countGroupItems(child, count + 1);
        } else {
          return count;
        }
      };
      const haveMinimalSpacing = (item2: Required<RandomizerItemInterface>) => {
        const lastIdx = generatedItems.map(o => o.name).lastIndexOf(item2.name);
        const currentIdx = generatedItems.length;
        return lastIdx === -1 || lastIdx + item2.minimalSpacing + countGroupItems(item2) < currentIdx;
      };
      const addGroupItems = (item2: RandomizerItemInterface, _generatedItems: RandomizerItemInterface[]) => {
        const child = items.find(o => o.groupId === item2.id);
        if (child) {
          _generatedItems.push(child);
          addGroupItems(child, _generatedItems);
        }
      };

      for (const item2 of items) {
        if (item2.numOfDuplicates > 0 && haveMinimalSpacing(item2) && !item2.groupId /* is not grouped or is parent of group */) {
          generatedItems.push(item2);
          item2.numOfDuplicates--;
          addGroupItems(item2, generatedItems);
        }
      }

      // run next iteration if some items are still there and that any change was made
      // so we don't have infinite loop when e.g. minimalspacing is not satisfied
      if (items.filter(o => o.numOfDuplicates > 0).length > 0 && !isEqual(items.filter(o => o.numOfDuplicates > 0), beforeItems)) {
        generateItems(items, generatedItems);
      }
      return generatedItems;
    };

    return {
      // refs
      form1,
      valid1,
      item,
      stepper,
      typeItems,
      permissionItems,
      rules,
      saving,
      loading,

      // functions
      save,
      addOption,
      generateItems,

      // others
      translate,
      getContrastColor,

      // icons
      mdiClose,
      mdiPlus,
      mdiExclamationThick,
      mdiFloppy,
    };
  },
});
</script>
