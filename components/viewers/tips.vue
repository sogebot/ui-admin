<template>
  <v-dialog
    v-model="dialog"
    persistent
    max-width="600px"
    transition="dialog-bottom-transition"
  >
    <template #activator="{ on, attrs }">
      <div
        v-bind="attrs"
        v-on="on"
      >
        {{ Intl.NumberFormat($store.state.configuration.lang, { style: 'currency', currency: $store.state.configuration.currency }).format(sum) }}
      </div>
    </template>

    <v-card>
      <v-card-title class="headline">
        Update <code class="mx-2">{{ username }}</code> {{ translate('tips').toLowerCase() }}
      </v-card-title>

      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="tips"
          sort-by="tippedAt"
          :sort-desc="true"
          hide-default-header
        >
          <template #top>
            <v-btn
              @click="tips.push({
                id: uuid(),
                amount: 0,
                currency: $store.state.configuration.currency,
                message: '',
                tippedAt: Date.now(),
              })"
            >
              add tip
            </v-btn>
          </template>

          <template #[`item.tippedAt`]="{ item }">
            <v-edit-dialog
              persistent
              large
              :return-value.sync="item.tippedAt"
            >
              {{ dayjs(item.tippedAt).format('LL') }} {{ dayjs(item.tippedAt).format('LTS') }}
              <template #input>
                {{ item.tippedAt}}
                <datetime :key="userId + 'tippedAt'" @input="item.tippedAt = $event" />
              </template>
            </v-edit-dialog>
          </template>

          <template #[`item.amount`]="{ item }">
            <v-edit-dialog
              persistent
              large
              :return-value.sync="item.amount"
              @open="currencyBackup = item.currency"
              @close="item.currency = currencyBackup"
              @save="currencyBackup = item.currency"
            >
              {{ Intl.NumberFormat($store.state.configuration.lang, { style: 'currency', currency: item.currency }).format(item.amount) }}
              <template #input>
                <v-text-field
                  v-model="item.amount"
                  type="number"
                  min="0"
                  step="0.01"
                  :rules="rules.amount"
                  single-line
                />
                <v-select
                  v-model="item.currency"
                  :items="currencyItems"
                />
              </template>
            </v-edit-dialog>
          </template>

          <template #[`item.button`]="{ item }">
            <v-icon @click="remove(item)">
              {{ mdiDelete }}
            </v-icon>
          </template>

          <template #[`item.message`]="{ item }">
            <v-edit-dialog
              persistent
              large
              :return-value.sync="item.message"
            >
              <span :class="{ 'text--lighten-1': item.message.trim().length === 0, 'red--text': item.message.trim().length === 0 }">
                {{ item.message.trim().length === 0 ? 'no message' : item.message }}
              </span>
              <template #input>
                <v-lazy>
                  <v-textarea
                    v-model="item.message"
                    :rows="1"
                    single-line
                    counter
                    auto-grow
                    autofocus
                    @keydown.enter.prevent
                  />
                </v-lazy>
              </template>
            </v-edit-dialog>
          </template>
        </v-data-table>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          color="blue darken-1"
          text
          @click="close"
        >
          Close
        </v-btn>
        <v-btn
          color="blue darken-1"
          text
          @click="save"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { mdiDelete } from '@mdi/js';
import {
  defineAsyncComponent,
  defineComponent, ref, watch,
} from '@nuxtjs/composition-api';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { capitalize, orderBy } from 'lodash';
import { v4 as uuid } from 'uuid';

import type { UserInterface, UserTipInterface } from '.bot/src/database/entity/user';
import { minValue, required } from '~/functions/validators';

export default defineComponent({
  components: { datetime: defineAsyncComponent({ loader: () => import('~/components/datetime.vue') }) },
  props:      { sum: Number, userId: String },
  setup (props, ctx) {
    const tips = ref([] as UserTipInterface[]);
    const username = ref('');
    const dialog = ref(false);
    const timestamp = ref(Date.now());
    const currencyBackup = ref('USD');
    const rules = { amount: [required, minValue(0)] };

    const headers = [
      { value: 'tippedAt', text: '' },
      { value: 'amount', text: '' },
      { value: 'message', text: '' },
      { value: 'button', text: '' },
    ];

    const currencyItems = [
      { value: 'USD', text: 'USD' },
      { value: 'AUD', text: 'AUD' },
      { value: 'BGN', text: 'BGN' },
      { value: 'BRL', text: 'BRL' },
      { value: 'CAD', text: 'CAD' },
      { value: 'CHF', text: 'CHF' },
      { value: 'CNY', text: 'CNY' },
      { value: 'CZK', text: 'CZK' },
      { value: 'DKK', text: 'DKK' },
      { value: 'EUR', text: 'EUR' },
      { value: 'GBP', text: 'GBP' },
      { value: 'HKD', text: 'HKD' },
      { value: 'HRK', text: 'HRK' },
      { value: 'HUF', text: 'HUF' },
      { value: 'IDR', text: 'IDR' },
      { value: 'ILS', text: 'ILS' },
      { value: 'INR', text: 'INR' },
      { value: 'ISK', text: 'ISK' },
      { value: 'JPY', text: 'JPY' },
      { value: 'KRW', text: 'KRW' },
      { value: 'MXN', text: 'MXN' },
      { value: 'MYR', text: 'MYR' },
      { value: 'NOK', text: 'NOK' },
      { value: 'NZD', text: 'NZD' },
      { value: 'PHP', text: 'PHP' },
      { value: 'PLN', text: 'PLN' },
      { value: 'RON', text: 'RON' },
      { value: 'RUB', text: 'RUB' },
      { value: 'SEK', text: 'SEK' },
      { value: 'SGD', text: 'SGD' },
      { value: 'THB', text: 'THB' },
      { value: 'TRY', text: 'TRY' },
      { value: 'ZAR', text: 'ZAR' },
    ];

    watch(dialog, (val) => {
      if (val) {
        // load tips
        getSocket('/core/users').emit('viewers::findOne', props.userId, (error: null | string, viewer: UserInterface & { tips: UserTipInterface[] }) => {
          if (error) {
            console.error(error);
            return;
          }
          console.log('User loaded', viewer);
          username.value = viewer.userName;
          tips.value = viewer.tips;
        });
      }
    });

    const save = () => {
      ctx.emit('save', tips.value);
      dialog.value = false;
    };

    const close = () => {
      ctx.emit('close');
      dialog.value = false;
    };

    const remove = (item: UserTipInterface) => {
      tips.value.splice(tips.value.findIndex(o => o.id === item.id), 1);
    };

    return {
      orderBy,
      translate,
      username,
      dialog,
      capitalize,
      close,
      save,
      remove,
      tips,
      headers,
      uuid,
      dayjs,
      timestamp,
      currencyItems,
      currencyBackup,
      rules,
      mdiDelete,
    };
  },
});
</script>
