<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <h2 v-if="!$vuetify.breakpoint.mobile">
      {{ translate('menu.goals') }}
    </h2>

    <new-item />

    <v-data-table
      v-model="selected"
      show-expand
      :expanded="expanded"
      :single-expand="true"
      calculate-widths
      :show-select="selectable"
      :search="search"
      :loading="state.loading !== ButtonStates.success"
      :headers="headers"
      :items-per-page="-1"
      :items="items"
      sort-by="name"
      @current-items="saveCurrentItems"
      @click:row="addToSelectedItem"
    >
      <template #top>
        <v-sheet flat color="dark" class="my-2 p-2">
          <v-row class="px-2" no-gutters>
            <v-col cols="auto" align-self="center" class="pr-2">
              <v-btn icon :color="selectable ? 'primary' : 'secondary'" @click="selectable = !selectable">
                <v-icon>
                  {{ mdiCheckBoxMultipleOutline }}
                </v-icon>
              </v-btn>
            </v-col>
            <v-col align-self="center">
              <v-text-field
                v-model="search"
                :append-icon="mdiMagnify"
                label="Search"
                single-line
                hide-details
                class="pa-0 ma-2"
              />
            </v-col>
            <v-col cols="auto" align-self="center">
              <template v-if="selected.length > 0">
                <v-dialog v-model="deleteDialog" max-width="500px">
                  <template #activator="{ on, attrs }">
                    <v-btn color="error" class="mr-1" v-bind="attrs" v-on="on">
                      Delete {{ selected.length }} Item(s)
                    </v-btn>
                  </template>

                  <v-card>
                    <v-card-title>
                      <span class="headline">Delete {{ selected.length }} Item(s)?</span>
                    </v-card-title>

                    <v-card-text>
                      <v-data-table
                        dense
                        :items="selected"
                        :headers="headersDelete"
                        :items-per-page="-1"
                        hide-default-header
                        hide-default-footer
                      >
                        <template #[`item.items`]="{ item }">
                          {{ item.goals.map(o => o.name). join(', ') }}
                        </template>
                      </v-data-table>
                    </v-card-text>
                    <v-card-actions>
                      <v-spacer />
                      <v-btn text @click="deleteDialog = false">
                        Cancel
                      </v-btn>
                      <v-btn color="error" text @click="deleteSelected">
                        Delete
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog>
              </template>

              <v-btn color="primary" to="/registry/goals/new" nuxt>
                New Item
              </v-btn>
            </v-col>
          </v-row>
        </v-sheet>
      </template>

      <template #[`item.items`]="{ item }">
        {{ item.goals.map(o => o.name). join(', ') }}
      </template>

      <template #[`item.display.type`]="{ item }">
        <v-simple-table dense class="transparent">
          <template #default>
            <tbody>
              <tr v-for="key of Object.keys(item.display)" :key="key" dense>
                <td>
                  {{ translate('registry.goals.input.' + key + '.title') }}
                </td>
                <td>
                  {{ item.display[key] }}
                </td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
      </template>

      <template #[`item.actions`]="{ item }">
        <div style="width: max-content;">
          <v-hover v-slot="{ hover }">
            <v-btn icon :color="hover ? 'primary' : 'secondary lighten-3'" nuxt :to="'/registry/goals/' + item.id" @click.stop>
              <v-icon>{{ mdiPencil }}</v-icon>
            </v-btn>
          </v-hover>

          <v-hover v-slot="{ hover }">
            <v-btn icon :color="hover ? 'primary' : 'secondary lighten-3'" @click.stop="clone(item)">
              <v-icon>{{ mdiContentCopy }}</v-icon>
            </v-btn>
          </v-hover>

          <v-hover v-slot="{ hover }">
            <v-btn icon :color="hover ? 'primary' : 'secondary lighten-3'" :href="'/overlays/goals/' + item.id" @click.stop>
              <v-icon>{{ mdiLink }}</v-icon>
            </v-btn>
          </v-hover>
        </div>
      </template>

      <template #expanded-item="{ headers, item }">
        <td :colspan="headers.length" class="py-2">
          <template v-for="(goal, idx) of item.goals">
            <v-simple-table :key="goal.id" dense>
              <template #default>
                <thead>
                  <tr>
                    <td colspan="2" class="text-h6">
                      {{ goal.name }}
                    </td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      {{ translate('registry.goals.input.type.title') }}
                    </td>
                    <td>
                      {{ goal.type }}
                    </td>
                  </tr>

                  <tr v-if="goal.type === 'tips'">
                    <td>
                      {{ translate('registry.goals.input.countBitsAsTips.title') }}
                    </td>
                    <td>
                      {{ !!goal.countBitsAsTips }}
                    </td>
                  </tr>

                  <tr>
                    <td>
                      {{ translate('registry.goals.input.goalAmount.title') }}
                    </td>
                    <td>
                      {{ goal.goalAmount }}
                    </td>
                  </tr>

                  <tr>
                    <td>
                      {{ translate('registry.goals.input.endAfter.title') }}
                    </td>
                    <td>
                      <v-icon v-if="goal.endAfterIgnore">
                        {{ mdiInfinity }}
                      </v-icon>
                      <template v-else>
                        {{ dayjs(goal.endAfter).format('LL') }} {{ dayjs(goal.endAfter).format('LTS') }}
                      </template>
                    </td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
            <v-divider v-if="idx < item.goals.length - 1" :key="goal.id + 'divider'" class="ma-4" />
          </template>
        </td>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import {
  mdiCheckBoxMultipleOutline, mdiContentCopy, mdiInfinity, mdiLink, mdiMagnify, mdiPencil,
} from '@mdi/js';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';
import { v4 } from 'uuid';

import type { GoalGroupInterface } from '.bot/src/bot/database/entity/goal';
import { addToSelectedItem } from '~/functions/addToSelectedItem';
import api from '~/functions/api';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';

export default defineComponent({
  setup (_, ctx) {
    const items = ref([] as GoalGroupInterface[]);
    const search = ref('');

    const selected = ref([] as GoalGroupInterface[]);
    const expanded = ref([] as GoalGroupInterface[]);
    const currentItems = ref([] as GoalGroupInterface[]);
    const deleteDialog = ref(false);
    const selectable = ref(false);
    const saveCurrentItems = (value: GoalGroupInterface[]) => {
      currentItems.value = value;
    };
    watch(selectable, (val) => {
      if (!val) {
        selected.value = [];
      }
    });

    const state = ref({ loading: ButtonStates.progress } as {
      loading: number;
    });

    const headers = [
      { value: 'name', text: translate('timers.dialog.name') },
      { value: 'display.type', text: translate('registry.goals.input.displayAs.title') },
      {
        value: 'items', text: 'Items', sortable: false,
      },
      {
        value: 'actions', text: '', sortable: false,
      },
      { text: '', value: 'data-table-expand' },
    ];

    const headersDelete = [
      { value: 'name', text: translate('timers.dialog.name') },
      { value: 'display.type', text: translate('registry.goals.input.displayAs.title') },
      { value: 'items', text: 'Items' },
    ];

    onMounted(() => {
      refresh();
      EventBus.$on('goals::refresh', refresh);
    });

    const refresh = () => {
      api.get<GoalGroupInterface[]>(ctx.root.$axios, '/api/v1/registry/goals')
        .then((response) => {
          items.value = response.data.data;
          // we also need to reset selection values
          if (selected.value.length > 0) {
            selected.value.forEach((selectedItem, index) => {
              selectedItem = items.value.find(o => o.id === selectedItem.id) || selectedItem;
              selected.value[index] = selectedItem;
            });
          }
        })
        .catch(err => error(err))
        .finally(() => (state.value.loading = ButtonStates.success));
    };

    const deleteSelected = async () => {
      deleteDialog.value = false;
      await Promise.all(
        selected.value.map((item) => {
          return new Promise((resolve) => {
            api.delete(ctx.root.$axios, `/api/v1/registry/goals/${item.id}`)
              .finally(() => resolve(true));
          });
        }),
      );
      refresh();

      EventBus.$emit('snack', 'success', 'Data removed.');
      selected.value = [];
    };

    const clone = (group: GoalGroupInterface) => {
      const clonedGroupId = v4();
      const clonedGroup = {
        ...group,
        id:    clonedGroupId,
        name:  group.name + ' (clone)',
        goals: group.goals.map(goal => ({
          ...goal, id: v4(), groupId: clonedGroupId,
        })),
      };

      api.post(ctx.root.$axios, '/api/v1/registry/goals', clonedGroup)
        .then(() => {
          EventBus.$emit('snack', 'success', 'Data cloned.');
        })
        .catch(err => error(err))
        .finally(refresh);
    };

    return {
      // refs
      items,
      search,
      state,
      headers,
      headersDelete,
      selected,
      deleteSelected,
      selectable,
      deleteDialog,
      translate,
      currentItems,
      expanded,

      // functions
      addToSelectedItem: addToSelectedItem(selected, 'id', currentItems),
      clone,
      saveCurrentItems,

      // icons
      mdiMagnify,
      mdiCheckBoxMultipleOutline,
      mdiContentCopy,
      mdiPencil,
      mdiInfinity,
      mdiLink,

      // others
      dayjs,
      ButtonStates,
    };
  },
});
</script>
