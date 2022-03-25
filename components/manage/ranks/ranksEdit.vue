<template>
  <v-dialog
    v-model="menu"
    persistent
    max-width="800"
    scrollable
    :fullscreen="$vuetify.breakpoint.mobile"
  >
    <template #activator="{ on, attrs }">
      <v-btn v-if="item.id !== undefined" icon v-bind="attrs" class="primary-hover" v-on="on">
        <v-icon>
          mdi-pencil
        </v-icon>
      </v-btn>
      <v-btn v-else v-bind="attrs" color="primary" v-on="on">
        New item
      </v-btn>
    </template>
    <v-card outlined class="pt-3">
      <v-card-text>
        <v-form ref="form" v-model="valid" lazy-validation>
          <v-text-field
            v-model.number="item.rank"
            min="0"
            :label="$t('rank')"
            :rules="rules.rank"
            required
          />
          <v-text-field
            type="number"
            v-model.number="item.value"
            min="0"
            :label="capitalize($t(item.type === 'viewer' ? 'hours' : 'months'))"
            :rules="rules.value"
            required
          />

          <v-select
            :label="capitalize($t('type'))"
            v-model="item.type"
            :items="Object.keys(types || {})"
            item-value="name"
          >
            <template #item="{ item: item2 }">
              {{ types && types[item2].name }} time
            </template>
            <template #selection="{ item: item2 }">
              {{ types && types[item2].name }} time
            </template>
          </v-select>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />

        <v-btn text @click="menu = false">
          Close
        </v-btn>
        <v-btn color="primary" :loading="saving" text :disabled="!valid" @click="save()">
          Save &amp; Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import type { RankInterface } from '@entity/rank';
import { defineComponent, ref, watch } from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import capitalize from 'lodash/capitalize';
import cloneDeep from 'lodash/cloneDeep';
import { v4 } from 'uuid';

import { EventBus } from '~/functions/event-bus';

type Props = {
  value: RankInterface;
  rules: [];
  types: Record<string, any>;
};

const newItem: RankInterface = {
  value: 0,
  rank:  '',
  type:  'viewer',
};

export default defineComponent({
  props: {
    value: Object,
    rules: Object,
    types: Object,
  },
  setup (props: Props, ctx) {
    const menu = ref(false);
    const item = ref(cloneDeep(props.value || newItem));
    const valid = ref(true);
    const form = ref(null);
    const group = ref('');
    const saving = ref(false);

    let id: null | string = null;

    const resetForm = () => {
      valid.value = true;
      if (form.value as unknown) {
        (form.value as unknown as HTMLFormElement).resetValidation();
        item.value = cloneDeep(props.value || newItem);
      } else {
        setTimeout(() => {
          resetForm();
        }, 100);
      }
    };

    watch(menu, (val) => {
      if (val) {
        resetForm();
      }
    });

    const save = () => {
      if ((form.value as unknown as HTMLFormElement).validate()) {
        // check validity
        for (const key of Object.keys(props.rules)) {
          for (const rule of (props.rules as any)[key]) {
            const ruleStatus = rule((item.value as any)[key]);
            if (ruleStatus === true) {
              continue;
            } else {
              EventBus.$emit('snack', 'red', `[${key}] - ${ruleStatus}`);
              return;
            }
          }
        }

        id = item.value.id
          ? item.value.id
          : (id || v4());

        console.log('Updating', item.value);
        saving.value = true;
        getSocket('/systems/ranks').emit('ranks::save', { id, ...item.value }, (err) => {
          saving.value = false;
          if (err) {
            if (err.includes('UNIQUE constraint failed')) {
              EventBus.$emit('snack', 'error', 'Type and hours/months must be unique.');
            }
          } else {
            EventBus.$emit('snack', 'success', 'Data updated.');
            ctx.emit('save');
            menu.value = false;
          }
        });
      }
    };

    return {
      menu, item, save, translate, capitalize, valid, saving, form, group,
    };
  },
});
</script>
