<template>
  <v-card :loading="isLoading" class="fill-height">
    <v-toolbar dense color="dark" style="z-index: 999;">
      <v-btn icon @click="goBack">
        <v-icon>{{ mdiClose }}</v-icon>
      </v-btn>
      <span v-if="$route.params.id === 'new'" class="headline">New Item</span>
      <span v-else class="headline">Edit Item</span>
      <v-spacer />
      <v-btn text :loading="isSaving" :disabled="!valid1 || isLoading" @click="save">
        {{ translate('dialog.buttons.saveChanges.idle') }}
      </v-btn>
    </v-toolbar>

    <v-fade-transition>
      <v-container v-if="!isLoading" fluid>
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
              <v-slider v-model="item.tickVolume" min="0" max="100" step="1" :label="translate('volume')">
                <template #append>
                  <v-text-field
                    v-model="item.tickVolume"
                    disabled
                    class="mt-0 pt-0"
                    hide-details
                    single-line
                    type="number"
                    style="width: 60px;"
                  >
                    <template #append>
                      %
                    </template>
                  </v-text-field>
                </template>
              </v-slider>
            </div>
          </v-expand-transition>
        </v-form>

        <v-expansion-panels :value="3">
          <position v-model="item.position" :disabled="item.type !== 'simple'" />
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

    <v-overlay v-if="isLoading">
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
  mdiClose, mdiExclamationThick, mdiPlus,
} from '@mdi/js';
import { getContrastColor, getRandomColor } from '@sogebot/ui-helpers/colors';
import { defaultPermissions } from '@sogebot/ui-helpers/permissions/defaultPermissions';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  computed,
  defineAsyncComponent,
  defineComponent, onMounted, ref,
} from '@vue/composition-api';
import {
  cloneDeep, isEqual, orderBy,
} from 'lodash-es';
import { v4 } from 'uuid';

import { PermissionsInterface } from '~/.bot/src/bot/database/entity/permissions';
import { RandomizerInterface, RandomizerItemInterface } from '~/.bot/src/bot/database/entity/randomizer';
import api from '~/functions/api';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import {
  minLength, required, startsWith,
} from '~/functions/validators';

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
  setup (_, ctx) {
    const stepper = ref(1);

    const form1 = ref(null);
    const valid1 = ref(true);

    const isSaving = ref(false);
    const isLoading = ref(false);

    const item = ref(cloneDeep(emptyItem) as RandomizerInterface);
    const permissions = ref([] as PermissionsInterface[]);

    const typeItems = [{ text: translate('registry.randomizer.form.simple'), value: 'simple' }, { text: translate('registry.randomizer.form.wheelOfFortune'), value: 'wheelOfFortune' }];
    const permissionItems = computed(() => {
      return permissions.value.map(o => ({
        text:     o.name,
        value:    o.id,
        disabled: false,
      }));
    });

    const rules = { name: [required], command: [required, startsWith(['!']), minLength(3)] };

    onMounted(() => {
      if (ctx.root.$route.params.id && ctx.root.$route.params.id !== 'new') {
        // load initial item
        isLoading.value = true;
        api.getOne<RandomizerInterface>(ctx.root.$axios, `/api/v1/registry/randomizer/`, String(ctx.root.$route.params.id) ?? '')
          .then((response) => {
            item.value = response.data;
            isLoading.value = false;
          })
          .catch(() => {
            ctx.root.$router.push({ path: '/registry/randomizer' });
            EventBus.$emit('snack', 'error', 'Data not found.');
          });

        getSocket('/core/permissions').emit('permissions', (err: string | null, data: Readonly<Required<PermissionsInterface>>[]) => {
          if (err) {
            return error(err);
          }
          permissions.value = data;
        });
      }
    });

    const save = () => {
      if (
        (form1.value as unknown as HTMLFormElement).validate()
      ) {
        isSaving.value = true;
        api.patch(ctx.root.$axios, `/api/v1/registry/randomizer/${item.value.id ?? v4()}`, item.value)
          .then((response) => {
            ctx.root.$router.push({ params: { id: response.id ?? '' } });
            EventBus.$emit('snack', 'success', 'Data saved.');
          })
          .catch((e) => {
            console.error(e.response.data);
            error(JSON.stringify(e.response.data));
          })
          .finally(() => (isSaving.value = false));
      }
    };

    const goBack = () => {
      ctx.root.$router.push({ path: '/registry/randomizer' });
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
      isSaving,
      isLoading,
      form1,
      valid1,
      item,
      stepper,
      typeItems,
      permissionItems,
      rules,

      // functions
      save,
      goBack,
      addOption,
      generateItems,

      // others
      translate,
      getContrastColor,

      // icons
      mdiClose,
      mdiPlus,
      mdiExclamationThick,
    };
  },
});
</script>
