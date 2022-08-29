<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <alert-disabled system="timers" />

    <v-expand-transition>
      <v-app-bar v-if="selected.length > 0" color="blue-grey darken-4" fixed dense>
        <v-row class="px-2" dense justify="end">
          <v-col cols="auto" align-self="center">
            {{ selected.length }} items selected
          </v-col>

          <v-col cols="auto" align-self="center">
            <v-row dense>
              <v-col v-if="selected.length > 0" cols="auto" class="pr-1">
                <manage-timers-batch
                  :length="selected.length"
                  @save="batchUpdate($event)"
                />
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
      show-select
      calculate-widths
      :search="search"
      :loading="loading"
      :headers="headers"
      :items-per-page="-1"
      :items="items"
      @current-items="saveCurrentItems"
    >
      <template #top>
        <table-search-bar :search.sync="search">
          <manage-timers-edit
            :rules="rules"
            @save="refetch()"
          />
        </table-search-bar>
      </template>

      <template #[`item`]="{ item }">
        <table-mobile :headers="headers" :selected="selected" :item="item" :add-to-selected-item="addToSelectedItem(selected, 'id', currentItems)">
          <template #actions>
            <manage-timers-edit
              :rules="rules"
              :value="item"
              @save="refetch()"
            />
            <v-btn class="danger-hover" icon @click="selected = [item]; deleteDialog = true;">
              <v-icon>
                mdi-delete-forever
              </v-icon>
            </v-btn>
          </template>

          <template #messages>
            <ol>
              <li
                v-for="message of item.messages"
                :key="message.id"
                :class="{
                  'grey--text': !message.isEnabled
                }"
              >
                {{ message.response | truncate(150) }}
              </li>
            </ol>
          </template>
        </table-mobile>
      </template>
    </v-data-table>
  </v-container>
</template>

<script setup lang="ts">
import type { Timer } from '@entity/timer';
import translate from '@sogebot/ui-helpers/translate';
import axios from 'axios';
import { capitalize, orderBy } from 'lodash';

import { addToSelectedItem } from '~/functions/addToSelectedItem';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import {
  minLength, minValue, mustBeCompliant, required,
} from '~/functions/validators';

const rules = {
  name:                [required, minLength(2), mustBeCompliant('a-zA-Z0-9_')],
  triggerEveryMessage: [required, minValue(0)],
  triggerEverySecond:  [required, minValue(0)],
};

const search = ref('');
const loading = ref(true);
const items = ref([] as Required<Timer>[]);
const selected = ref([] as Timer[]);
const currentItems = ref([] as Timer[]);
const saveCurrentItems = (value: Timer[]) => {
  currentItems.value = value;
};

const deleteDialog = ref(false);

const headers = [
  { value: 'name', text: translate('timers.dialog.name') },
  {
    value: 'tickOffline', text: translate('timers.dialog.tickOffline'), align: 'center',
  },
  {
    value: 'isEnabled', text: translate('enabled'), align: 'center',
  },
  // virtual attributes
  {
    value: 'triggerEveryMessage', text: translate('messages'), align: 'right',
  },
  {
    value: 'triggerEverySecond', text: capitalize(translate('seconds')), align: 'right',
  },
  { value: 'messages', text: translate('timers.dialog.responses') },
  { value: 'actions', sortable: false },
];

const headersDelete = [
  { value: 'name', text: translate('timers.dialog.name') },
];

const refetch = () => {
  axios.get(`/api/systems/timer`, { headers: { authorization: `Bearer ${localStorage.accessToken}` } })
    .then(({ data }) => {
    // we also need to reset selection values
      if (selected.value.length > 0) {
        selected.value.forEach((selectedItem, index) => {
          selectedItem = items.value.find(o => o.id === selectedItem.id) || selectedItem;
          selected.value[index] = selectedItem;
        });
      }
      items.value.length = 0;
      for (const item of data.data) {
        items.value.push({
          ...item,
          messages: orderBy(item.messages, 'timestamp', 'asc'),
        });
      }
      loading.value = false;
    });
};

onMounted(() => {
  refetch();
});

const deleteSelected = async () => {
  deleteDialog.value = false;
  await Promise.all(
    selected.value.map((item) => {
      return new Promise((resolve, reject) => {
        if (!item.id) {
          reject(error('Missing item id'));
          return;
        }
        axios.delete(`/api/systems/timer/${item.id}`, { headers: { authorization: `Bearer ${localStorage.accessToken}` } })
          .finally(() => resolve(true));
      });
    }),
  );
  refetch();

  EventBus.$emit('snack', 'success', 'Data removed.');
  selected.value = [];
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
      const { id, ...data } = item;
      console.log('Updating', { id, data });

      axios.post(`/api/systems/timer`,
        { ...item },
        { headers: { authorization: `Bearer ${localStorage.accessToken}` } })
        .then(() => {
          saveSuccess();
        });
    }
  }
};

const saveSuccess = () => {
  refetch();
  EventBus.$emit('snack', 'success', 'Data updated.');
};

</script>
