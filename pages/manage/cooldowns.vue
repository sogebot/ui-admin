<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <v-alert
      v-if="!$store.state.$systems.find(o => o.name === 'cooldown').enabled"
      color="error"
      class="mb-0"
    >
      {{ translate('this-system-is-disabled') }}
    </v-alert>

    <v-data-table
      v-model="selected"
      calculate-widths
      :show-select="selectable"
      :search="search"
      :loading="state.loading !== ButtonStates.success"
      :headers="headers"
      :items-per-page="-1"
      :items="items"
      @current-items="saveCurrentItems"
      @click:row="addToSelectedItem"
    >
      <template #top>
        <v-sheet
          flat
          color="dark"
          class="my-2 pb-2 mt-0"
        >
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
                <v-dialog
                  v-model="deleteDialog"
                  max-width="500px"
                >
                  <template #activator="{ on, attrs }">
                    <v-btn
                      color="error"
                      class="mr-1"
                      v-bind="attrs"
                      v-on="on"
                    >
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
                      />
                    </v-card-text>
                    <v-card-actions>
                      <v-spacer />
                      <v-btn
                        text
                        @click="deleteDialog = false"
                      >
                        Cancel
                      </v-btn>
                      <v-btn
                        color="error"
                        text
                        @click="deleteSelected"
                      >
                        Delete
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog>
              </template>

              <v-dialog
                v-model="newDialog"
                max-width="500px"
              >
                <template #activator="{ on, attrs }">
                  <v-btn
                    color="primary"
                    v-bind="attrs"
                    v-on="on"
                  >
                    New Item
                  </v-btn>
                </template>

                <v-card>
                  <v-card-title>
                    <span class="headline">New item</span>
                  </v-card-title>

                  <v-card-text :key="timestamp">
                    <new-item
                      :rules="rules"
                      @close="newDialog = false"
                      @save="saveSuccess"
                    />
                  </v-card-text>
                </v-card>
              </v-dialog>
            </v-col>
          </v-row>
        </v-sheet>
      </template>

      <template #[`item.name`]="{ item }">
        <v-edit-dialog
          persistent
          large
          :return-value.sync="item.name"
          @save="update(item, false, 'name')"
        >
          {{ item.name }}
          <template #input>
            <v-text-field
              v-model="item.name"
              :rules="rules.name"
              single-line
              counter
            />
          </template>
        </v-edit-dialog>
      </template>

      <template #[`item.count`]="{ item }">
        <v-edit-dialog
          persistent
          large
          :return-value.sync="item.count"
          @save="update(item, false, 'count')"
        >
          {{ item.count }}s
          <template #input>
            <v-text-field
              v-model.number="item.count"
              type="number"
              :rules="rules.count"
              single-line
            >
              <template #append>
                s
              </template>
            </v-text-field>
          </template>
        </v-edit-dialog>
      </template>

      <template #[`item.type`]="{ item }">
        <v-edit-dialog
          persistent
          large
          :return-value.sync="item.type"
          @save="update(item, true, 'type')"
        >
          {{ translate(item.type) }}
          <template #input>
            <v-select
              v-model="item.type"
              :items="typeItems"
            />
          </template>
        </v-edit-dialog>
      </template>

      <template #[`item.isEnabled`]="{ item }">
        <v-simple-checkbox
          v-model="item.isEnabled"
          @click="update(item, true, 'isEnabled')"
        />
      </template>

      <template #[`item.isErrorMsgQuiet`]="{ item }">
        <v-simple-checkbox
          v-model="item.isErrorMsgQuiet"
          @click="update(item, true, 'isErrorMsgQuiet')"
        />
      </template>

      <template #[`item.isOwnerAffected`]="{ item }">
        <v-simple-checkbox
          v-model="item.isOwnerAffected"
          @click="update(item, true, 'isOwnerAffected')"
        />
      </template>

      <template #[`item.isModeratorAffected`]="{ item }">
        <v-simple-checkbox
          v-model="item.isModeratorAffected"
          @click="update(item, true, 'isModeratorAffected')"
        />
      </template>

      <template #[`item.isSubscriberAffected`]="{ item }">
        <v-simple-checkbox
          v-model="item.isSubscriberAffected"
          @click="update(item, true, 'isSubscriberAffected')"
        />
      </template>

      <template #[`item.isFollowerAffected`]="{ item }">
        <v-simple-checkbox
          v-model="item.isFollowerAffected"
          @click="update(item, true, 'isFollowerAffected')"
        />
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import { mdiCheckBoxMultipleOutline, mdiMagnify } from '@mdi/js';
import {
  defineAsyncComponent, defineComponent, onMounted, ref, useStore, watch,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { capitalize } from 'lodash-es';

import type { CooldownInterface } from '.bot/src/bot/database/entity/cooldown';
import { error } from '~/functions//error';
import { addToSelectedItem } from '~/functions/addToSelectedItem';
import { EventBus } from '~/functions/event-bus';
import {
  minLength, minValue, required,
} from '~/functions/validators';

type CooldownInterfaceUI = CooldownInterface & { count: number };

export default defineComponent({
  components: { 'new-item': defineAsyncComponent({ loader: () => import('~/components/new-item/cooldowns-newItem.vue') }) },
  setup () {
    const store = useStore();
    const rules = { name: [required, minLength(2)], count: [required, minValue(30)] };

    const items = ref([] as CooldownInterfaceUI[]);
    const typeItems = [
      {
        text:     translate('global'),
        value:    'global',
        disabled: false,
      }, {
        text:     translate('user'),
        value:    'user',
        disabled: false,
      },
    ];
    const search = ref('');

    const selected = ref([] as CooldownInterfaceUI[]);
    const currentItems = ref([] as CooldownInterfaceUI[]);
    const saveCurrentItems = (value: CooldownInterfaceUI[]) => {
      currentItems.value = value;
    };
    const deleteDialog = ref(false);
    const newDialog = ref(false);
    const selectable = ref(false);
    watch(selectable, (val) => {
      if (!val) {
        selected.value = [];
      }
    });

    const timestamp = ref(Date.now());

    watch(newDialog, () => {
      timestamp.value = Date.now();
    });

    const state = ref({ loading: ButtonStates.progress } as {
      loading: number;
    });

    const headers = [
      { value: 'name', text: '!' + translate('command') + ', ' + translate('keyword') + ' ' + translate('or') + ' g:' + translate('group') },
      {
        value: 'count', text: translate('cooldown'), width: '7rem',
      },
      {
        value: 'type', text: translate('cooldown'), width: '7rem',
      },
      {
        value: 'isEnabled', text: capitalize(translate('enabled')), width: '6rem', align: 'center',
      },
      {
        value: 'isErrorMsgQuiet', text: capitalize(translate('quiet')), width: '6rem', align: 'center',
      },
      {
        value: 'isOwnerAffected', text: capitalize(translate('core.permissions.casters')), width: '6rem', align: 'center',
      },
      {
        value: 'isModeratorAffected', text: capitalize(translate('core.permissions.moderators')), width: '8rem', align: 'center',
      },
      {
        value: 'isSubscriberAffected', text: capitalize(translate('core.permissions.subscribers')), width: '8rem', align: 'center',
      },
      {
        value: 'isFollowerAffected', text: capitalize(translate('core.permissions.followers')), width: '7rem', align: 'center',
      },
    ];

    const headersDelete = [
      { value: 'name', text: '' },
    ];

    onMounted(() => {
      store.commit('panel/breadcrumbs', [
        { text: translate('menu.commands') },
        { text: translate('menu.cooldown') },
      ]);
      refresh();
    });

    const refresh = () => {
      getSocket('/systems/cooldown').emit('generic::getAll', (err: string | null, itemsGetAll: CooldownInterfaceUI[]) => {
        if (err) {
          return error(err);
        }
        console.debug('Loaded', itemsGetAll);
        items.value = itemsGetAll;
        for (const item of items.value) {
          item.count = item.miliseconds / 1000;
        }
        // we also need to reset selection values
        if (selected.value.length > 0) {
          selected.value.forEach((selectedItem, index) => {
            selectedItem = items.value.find(o => o.id === selectedItem.id) || selectedItem;
            selected.value[index] = selectedItem;
          });
        }
        state.value.loading = ButtonStates.success;
      });
    };

    const saveSuccess = () => {
      refresh();
      EventBus.$emit('snack', 'success', 'Data updated.');
      newDialog.value = false;
    };
    const update = async (item: typeof items.value[number], multi = false, attr: keyof typeof items.value[number]) => {
      // check validity
      for (const key of Object.keys(rules)) {
        for (const rule of (rules as any)[key]) {
          const ruleStatus = rule((item as any)[key]);
          if (ruleStatus === true) {
            continue;
          } else {
            EventBus.$emit('snack', 'red', `[${key}] - ${ruleStatus}`);
            refresh();
            return;
          }
        }
      }

      // update all instantly
      for (const i of [item, ...(multi ? selected.value : [])]) {
        (i as any)[attr] = item[attr];
      }

      await Promise.all(
        [item, ...(multi ? selected.value : [])].map((itemToUpdate) => {
          return new Promise((resolve) => {
            if (attr === 'count') {
              itemToUpdate.miliseconds = item.count * 1000;
            }
            console.log('Updating', { itemToUpdate }, { attr, value: item[attr] });
            getSocket('/systems/cooldown').emit('cooldown::save', {
              ...itemToUpdate,
              [attr]: item[attr], // save new value for all selected items
            }, () => {
              resolve(true);
            });
          });
        }),
      );
      refresh();
      EventBus.$emit('snack', 'success', 'Data updated.');
    };

    const deleteSelected = async () => {
      deleteDialog.value = false;
      await Promise.all(
        selected.value.map((item) => {
          return new Promise((resolve, reject) => {
            getSocket('/systems/cooldown').emit('generic::deleteById', item.id, (err: string | null) => {
              if (err) {
                reject(error(err));
              }
              resolve(true);
            });
          });
        }),
      );
      refresh();

      EventBus.$emit('snack', 'success', 'Data removed.');
      selected.value = [];
    };

    return {
      addToSelectedItem: addToSelectedItem(selected, 'id', currentItems),
      saveCurrentItems,
      items,
      search,
      state,
      headers,
      headersDelete,
      selected,
      deleteSelected,
      update,
      selectable,
      newDialog,
      deleteDialog,
      translate,
      saveSuccess,
      timestamp,
      rules,
      typeItems,
      mdiMagnify,
      mdiCheckBoxMultipleOutline,
      ButtonStates,
    };
  },
});
</script>
