<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <alert-disabled system="cooldown" />

    <v-expand-transition>
      <v-app-bar v-if="selected.length > 0" color="blue-grey darken-4" fixed dense>
        <v-row class="px-2" dense justify="end">
          <v-col cols="auto" align-self="center">
            {{ selected.length }} items selected
          </v-col>

          <v-col cols="auto" align-self="center">
            <v-row dense>
              <v-col v-if="selected.length > 0" cols="auto" class="pr-1">
                <cooldowns-batch :length="selected.length" :rules="rules" @save="batchUpdate($event)" />
              </v-col>
              <v-col v-if="selected.length > 0" cols="auto">
                <v-dialog v-model="deleteDialog" max-width="500px">
                  <template #activator="{ on, attrs }">
                    <v-btn class="error" small v-bind="attrs" v-on="on">
                      <v-icon left>
                        mdi-delete-forever
                      </v-icon>
                      Delete
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
                      <v-btn text @click="deleteDialog = false">
                        Cancel
                      </v-btn>
                      <v-btn color="error" text @click="deleteSelected">
                        Delete
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-app-bar>
    </v-expand-transition>

    <v-data-table
      v-model="selected"
      calculate-widths
      show-select
      :search="search"
      :loading="state.loading !== ButtonStates.success"
      :headers="headers"
      :items-per-page="-1"
      :items="items"
      @current-items="saveCurrentItems"
    >
      <template #top>
        <table-search-bar :search.sync="search">
          <cooldowns-edit :rules="rules" :type-items="typeItems" @save="refresh()" />
        </table-search-bar>
      </template>

      <template #[`item`]="{ item }">
        <table-mobile :headers="headers" :selected="selected" :item="item" :add-to-selected-item="addToSelectedItem">
          <template #actions>
            <cooldowns-edit :rules="rules" :value="item" :type-items="typeItems" @save="refresh()" />
            <v-btn class="danger-hover" icon @click="selected = [item]; deleteDialog = true;">
              <v-icon>
                mdi-delete-forever
              </v-icon>
            </v-btn>
          </template>

          <template #name>
            {{ item.name }}
            <div class="grey--text">
              {{ item.type }}
            </div>
          </template>
          <template #miliseconds>
            {{ item.miliseconds | time }}
          </template>
        </table-mobile>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import type { CooldownInterface } from '@entity/cooldown';
import {
  defineAsyncComponent, defineComponent, onMounted, ref,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { capitalize } from 'lodash';

import { error } from '~/functions//error';
import { addToSelectedItem } from '~/functions/addToSelectedItem';
import { EventBus } from '~/functions/event-bus';
import {
  minLength, minValue, required,
} from '~/functions/validators';

export default defineComponent({
  components: {
    'cooldowns-edit':  defineAsyncComponent(() => import('~/components/manage/cooldowns/cooldownsEdit.vue')),
    'cooldowns-batch': defineAsyncComponent(() => import('~/components/manage/cooldowns/cooldownsBatch.vue')),
    'table-search-bar':      defineAsyncComponent(() => import('~/components/table/searchBar.vue')),
    'table-mobile':    defineAsyncComponent(() => import('~/components/table/tableMobile.vue')),
  },
  setup () {
    const rules = { name: [required, minLength(2)], miliseconds: [required] };

    const items = ref([] as CooldownInterface[]);
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

    const selected = ref([] as CooldownInterface[]);
    const deleteDialog = ref(false);

    const currentItems = ref([] as CooldownInterface[]);
    const saveCurrentItems = (value: CooldownInterface[]) => {
      currentItems.value = value;
    };

    const state = ref({ loading: ButtonStates.progress } as {
      loading: number;
    });

    const headers = [
      { value: 'name', text: '!' + translate('command') + ', ' + translate('keyword') + ' ' + translate('or') + ' g:' + translate('group') },
      {
        value: 'miliseconds', text: translate('cooldown'), align: 'right',
      },
      {
        value: 'isEnabled', text: capitalize(translate('enabled')), align: 'center',
      },
      {
        value: 'isErrorMsgQuiet', text: capitalize(translate('quiet')), align: 'center',
      },
      {
        value: 'isOwnerAffected', text: capitalize(translate('core.permissions.casters')), align: 'center',
      },
      {
        value: 'isModeratorAffected', text: capitalize(translate('core.permissions.moderators')), align: 'center',
      },
      {
        value: 'isSubscriberAffected', text: capitalize(translate('core.permissions.subscribers')), align: 'center',
      },
      { value: 'actions', sortable: false },
    ];

    const headersDelete = [
      { value: 'name', text: '' },
    ];

    onMounted(() => {
      refresh();
    });

    const refresh = () => {
      getSocket('/systems/cooldown').emit('generic::getAll', (err, itemsGetAll) => {
        if (err) {
          return error(err);
        }
        console.debug('Loaded', itemsGetAll);
        items.value = [...itemsGetAll];
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
    const batchUpdate = (value: Record<string, any>) => {
      // check validity
      for (const toUpdate of selected.value) {
        const item = items.value.find(o => o.id === toUpdate.id);
        if (!item) {
          continue;
        }

        let isValid = true;
        for (const key of Object.keys(rules)) {
          for (const rule of (rules as any)[key]) {
            const ruleStatus = rule((toUpdate as any)[key]);
            if (ruleStatus === true) {
              continue;
            } else {
              EventBus.$emit('snack', 'red', `[${key}] - ${ruleStatus}`);
              isValid = false;
            }
          }
        }

        if (isValid) {
          for (const key of Object.keys(value)) {
            if (typeof value[key] !== 'undefined') {
              (item as any)[key] = value[key];
            }
          }
          console.log('Updating', { item });

          getSocket('/systems/cooldown').emit('cooldown::save', item, () => {
            EventBus.$emit('snack', 'success', 'Data updated.');
            refresh();
          });
        }
      }
    };

    const deleteSelected = async () => {
      deleteDialog.value = false;
      await Promise.all(
        selected.value.map((item) => {
          return new Promise((resolve, reject) => {
            if (!item.id) {
              reject(error('Missing item id'));
              return;
            }
            getSocket('/systems/cooldown').emit('generic::deleteById', item.id, (err) => {
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

    const toggleItemSelection = (item: typeof items.value[number]) => {
      if (selected.value.find(o => o.id === item.id)) {
        // deselect
        selected.value = selected.value.filter(o => o.id !== item.id);
      } else {
        selected.value.push(item);
      }
    };

    return {
      addToSelectedItem: addToSelectedItem(selected, 'id', currentItems),
      saveCurrentItems,
      toggleItemSelection,
      items,
      search,
      state,
      headers,
      headersDelete,
      selected,
      deleteSelected,
      batchUpdate,
      deleteDialog,
      translate,
      rules,
      typeItems,
      ButtonStates,
      refresh,
      capitalize,
    };
  },
});
</script>
