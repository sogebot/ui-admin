<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <v-alert
      v-if="!$store.state.$systems.find(o => o.name === 'price').enabled"
      color="error"
      class="mb-0"
    >
      {{ translate('this-system-is-disabled') }}
    </v-alert>

    <v-data-table
      v-model="selected"
      calculate-widths
      :show-select="selectable"
      sort-by="command"
      :search="search"
      :loading="state.loading !== ButtonStates.success && state.loadingPrm !== ButtonStates.success"
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

      <template #[`item.command`]="{ item }">
        <v-edit-dialog
          persistent
          large
          :return-value.sync="item.command"
          @save="update(item, false, 'command')"
        >
          {{ item.command }}
          <template #input>
            <v-text-field
              v-model="item.command"
              :rules="rules.command"
              single-line
              counter
            />
          </template>
        </v-edit-dialog>
      </template>

      <template #[`item.price`]="{ item }">
        <v-edit-dialog
          persistent
          large
          @save="update(item, false, 'price');"
        >
          <div v-html="priceFormatter(item)" />

          <template #input>
            <v-text-field
              v-model.number="item.price"
              class="d-inline-block"
              type="number"
              :rules="rules.price"
              single-line
              :error="!isAtLeastOneValueAboveZero(item)"
            >
              <template #append>
                {{ getLocalizedName(2, $store.state.configuration.systems.Points.customization.name) }}
              </template>
            </v-text-field>
            {{ translate('or') }}
            <v-text-field
              v-model.number="item.priceBits"
              class="d-inline-block"
              :error="!isAtLeastOneValueAboveZero(item)"
              :error-messages="!isAtLeastOneValueAboveZero(item) ? ['Points or bits price needs to be set.'] : []"
              type="number"
              :rules="rules.priceBits"
              single-line
            >
              <template #append>
                {{ getLocalizedName(2, translate('bot.bits')) }}
              </template>
            </v-text-field>
          </template>
        </v-edit-dialog>
      </template>

      <template #[`item.emitRedeemEvent`]="{ item }">
        <v-simple-checkbox
          v-model="item.emitRedeemEvent"
          @click="update(item, true, 'emitRedeemEvent')"
        />
      </template>

      <template #[`item.enabled`]="{ item }">
        <v-simple-checkbox
          v-model="item.enabled"
          @click="update(item, true, 'enabled')"
        />
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import { mdiCheckBoxMultipleOutline, mdiMagnify } from '@mdi/js';
import {
  defineAsyncComponent,
  defineComponent, onMounted, ref, watch,
} from '@nuxtjs/composition-api';
import { useStore } from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { capitalize } from 'lodash-es';

import type { PriceInterface } from '.bot/src/bot/database/entity/price';
import {
  minLength, minValue, required, startsWith,
} from '~/functions//validators';
import { addToSelectedItem } from '~/functions/addToSelectedItem';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { getLocalizedName } from '~/functions/getLocalized';

export default defineComponent({
  components: { 'new-item': defineAsyncComponent({ loader: () => import('~/components/new-item/price-newItem.vue') }) },
  setup () {
    const store = useStore<any>();
    const timestamp = ref(Date.now());
    const search = ref('');
    const items = ref([] as PriceInterface[]);
    const selected = ref([] as PriceInterface[]);
    const currentItems = ref([] as PriceInterface[]);
    const saveCurrentItems = (value: PriceInterface[]) => {
      currentItems.value = value;
    };
    const selectable = ref(false);
    watch(selectable, (val) => {
      if (!val) {
        selected.value = [];
      }
    });
    const deleteDialog = ref(false);
    const newDialog = ref(false);

    const state = ref({ loading: ButtonStates.progress } as {
      loading: number;
    });

    // add oneIsAboveZero validation
    const rules = {
      price:     [minValue(0), required],
      priceBits: [minValue(0), required],
      command:   [required, minLength(2), startsWith(['!'])],
    };

    const headers = [
      { value: 'command', text: translate('command') },
      {
        value: 'enabled', text: translate('enabled'), width: '6rem', align: 'center',
      },
      {
        value: 'emitRedeemEvent', text: translate('systems.price.emitRedeemEvent'), width: '15rem', align: 'center',
      },
      { value: 'price', text: capitalize(translate('systems.price.price.name')) },
    ];
    const headersDelete = [
      { value: 'command', text: translate('command') },
    ];

    watch(newDialog, () => {
      timestamp.value = Date.now();
    });

    onMounted(() => {
      store.commit('panel/breadcrumbs', [
        { text: translate('menu.commands') },
        { text: translate('menu.price') },
      ]);
      refresh();
    });

    const refresh = () => {
      getSocket('/systems/price').emit('generic::getAll', (err: string | null, itemsGetAll: PriceInterface[]) => {
        if (err) {
          return error(err);
        }
        items.value = itemsGetAll;
        console.debug({ items: itemsGetAll });

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
      if (!isAtLeastOneValueAboveZero(item)) {
        EventBus.$emit('snack', 'red', `[price] - Points or bits price needs to be set.`);
        refresh();
        return;
      }

      // update all instantly
      for (const i of [item, ...(multi ? selected.value : [])]) {
        (i as any)[attr] = item[attr];
      }

      await Promise.all(
        [item, ...(multi ? selected.value : [])].map((itemToUpdate) => {
          return new Promise((resolve) => {
            console.log('Updating', { itemToUpdate }, { attr, value: item[attr] });
            getSocket('/systems/price').emit('price::save', {
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

    const saveSuccess = () => {
      refresh();
      EventBus.$emit('snack', 'success', 'Data updated.');
      newDialog.value = false;
    };

    const deleteSelected = async () => {
      deleteDialog.value = false;
      await Promise.all(
        selected.value.map((item) => {
          return new Promise((resolve, reject) => {
            getSocket('/systems/price').emit('generic::deleteById', item.id, (err: string | null) => {
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

    const isAtLeastOneValueAboveZero = (item: PriceInterface) => {
      return item.price > 0 || item.priceBits > 0;
    };

    const priceFormatter = (item: PriceInterface) => {
      const output = [];
      if (item.price !== 0) {
        output.push(`${item.price} ${getLocalizedName(item.price, store.state.configuration.systems.Points.customization.name)}`);
      }
      if (item.priceBits !== 0) {
        output.push(`${item.priceBits} ${getLocalizedName(item.priceBits, translate('bot.bits'))}`);
      }
      return output.join(` ${translate('or')} `);
    };

    return {
      addToSelectedItem: addToSelectedItem(selected, 'id', currentItems),
      saveCurrentItems,
      search,
      items,
      state,
      headers,
      headersDelete,
      update,
      getLocalizedName,
      translate,
      isAtLeastOneValueAboveZero,
      priceFormatter,

      selected,
      selectable,
      deleteDialog,
      newDialog,
      saveSuccess,
      timestamp,
      rules,
      deleteSelected,
      mdiMagnify,
      mdiCheckBoxMultipleOutline,
      ButtonStates,
    };
  },
});
</script>
