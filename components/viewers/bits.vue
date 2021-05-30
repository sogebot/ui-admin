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
        {{ Intl.NumberFormat($store.state.configuration.lang).format(sum) }}
      </div>
    </template>

    <v-card>
      <v-card-title class="headline">
        Update <code class="mx-2">{{ username }}</code> {{ translate('bits').toLowerCase() }}
      </v-card-title>

      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="bits"
          sort-by="cheeredAt"
          :sort-desc="true"
          hide-default-header
        >
          <template #top>
            <v-btn
              @click="bits.push({
                id: uuid(),
                amount: 0,
                message: '',
                cheeredAt: Date.now(),
              })"
            >
              add bit
            </v-btn>
          </template>

          <template #[`item.cheeredAt`]="{ item }">
            <v-edit-dialog
              persistent
              large
              :return-value.sync="item.cheeredAt"
            >
              {{ dayjs(item.cheeredAt).format('LL') }} {{ dayjs(item.cheeredAt).format('LTS') }}
              <template #input>
                <datetime :key="userId + 'cheeredAt'" :input.sync="item.cheeredAt" />
              </template>
            </v-edit-dialog>
          </template>

          <template #[`item.amount`]="{ item }">
            <v-edit-dialog
              persistent
              large
              :return-value.sync="item.amount"
            >
              {{ Intl.NumberFormat($store.state.configuration.lang).format(item.amount) }}
              <template #input>
                <v-text-field
                  v-model="item.amount"
                  type="number"
                  min="0"
                  step="1"
                  :rules="rules.amount"
                  single-line
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
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineAsyncComponent,
  defineComponent, ref, watch,
} from '@vue/composition-api';
import { capitalize, orderBy } from 'lodash-es';
import { v4 as uuid } from 'uuid';

import type { UserBitInterface, UserInterface } from '.bot/src/bot/database/entity/user';
import { minValue, required } from '~/functions/validators';

const socket = { users: getSocket('/core/users') } as const;
export default defineComponent({
  components: { datetime: defineAsyncComponent({ loader: () => import('~/components/datetime.vue') }) },
  props:      { sum: Number, userId: String },
  setup (props, ctx) {
    const bits = ref([] as UserBitInterface[]);
    const username = ref('');
    const dialog = ref(false);
    const timestamp = ref(Date.now());
    const currencyBackup = ref('USD');
    const rules = { amount: [required, minValue(0)] };

    const headers = [
      { value: 'cheeredAt', text: '' },
      { value: 'amount', text: '' },
      { value: 'message', text: '' },
      { value: 'button', text: '' },
    ];

    watch(dialog, (val) => {
      if (val) {
        socket.users.emit('viewers::findOne', props.userId, (error: null | string, viewer: UserInterface & { bits: UserBitInterface[] }) => {
          if (error) {
            console.error(error);
            return;
          }
          console.log('User loaded', viewer);
          username.value = viewer.username;
          bits.value = viewer.bits;
        });
      }
    });

    const save = () => {
      ctx.emit('save', bits.value);
      dialog.value = false;
    };

    const close = () => {
      ctx.emit('close');
      dialog.value = false;
    };

    const remove = (item: UserBitInterface) => {
      console.log({ item });
      bits.value.splice(bits.value.findIndex(o => o.id === item.id), 1);
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
      bits,
      headers,
      uuid,
      dayjs,
      timestamp,
      currencyBackup,
      rules,
      mdiDelete,
    };
  },
});
</script>
