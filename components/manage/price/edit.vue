<template>
  <div>
    <v-dialog
      v-model="menu"
      persistent
      max-width="500"
      scrollable
      :fullscreen="$vuetify.breakpoint.mobile"
    >
      <template #activator="{ on, attrs }">
        <v-btn v-if="item.id !== undefined" icon v-bind="attrs" v-on="on" class="primary-hover">
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
              v-model="item.command"
              hide-details="auto"
              :label="translate('command')"
              :rules="rules.command"
              :clearable="true"
              required
            />

            <v-row no-gutters align="baseline">
              <v-col>
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
              </v-col>
              <v-col class="text-center px-8" cols="auto">
                {{ translate('or') }}
              </v-col>
              <v-col>
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
              </v-col>
            </v-row>

            <v-row no-gutters>
              <v-col>
                <v-switch
                  v-model="item.enabled"
                  :label="translate('enabled')"
                  persistent-hint
                  hide-details="auto"
                  :hint="(item.enabled
                    ? 'Price is enabled.'
                    : 'Price is disabled.')"
                />
              </v-col>
              <v-col>
                <v-switch
                  v-model="item.emitRedeemEvent"
                  :label="capitalize(translate('systems.price.emitRedeemEvent'))"
                  persistent-hint
                  hide-details="auto"
                  :hint="(item.emitRedeemEvent
                    ? 'If price is paid, redeem event / alert will be triggered.'
                    : 'No event will be triggered.')"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />

          <v-btn text @click="menu = false">
            Cancel
          </v-btn>
          <v-btn color="primary" :loading="saving" text :disabled="!valid" @click="save()">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { getLocalizedName } from '@sogebot/ui-helpers/getLocalized';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, ref, watch,
} from '@vue/composition-api';
import capitalize from 'lodash/capitalize';
import cloneDeep from 'lodash/cloneDeep';
import { v4 } from 'uuid';

import type { PriceInterface } from '@entity/price';
import { EventBus } from '~/functions/event-bus';

type Props = {
  value: PriceInterface;
  rules: [];
};

const newItem: PriceInterface = {
  command:         '',
  priceBits:       0,
  price:           100,
  enabled:         true,
  emitRedeemEvent: false,
};

export default defineComponent({
  props: {
    value: Object,
    rules: Object,
  },
  setup (props: Props, ctx) {
    const menu = ref(false);
    const item = ref(cloneDeep(props.value || newItem));
    const valid = ref(true);
    const saving = ref(false);
    const form = ref(null);

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
        if (!isAtLeastOneValueAboveZero(item.value)) {
          EventBus.$emit('snack', 'red', `[price] - Points or bits price needs to be set.`);
          return;
        }
        console.log('Updating', item.value);

        saving.value = true;
        getSocket('/systems/price').emit('price::save', {
          ...item.value,
          id: item.value.id || v4(),
        }, () => {
          saving.value = false;
          menu.value = false;
          EventBus.$emit('snack', 'success', 'Data updated.');
          ctx.emit('save');
        });
      }
    };

    const isAtLeastOneValueAboveZero = (itemArg: PriceInterface) => {
      return itemArg.price > 0 || itemArg.priceBits > 0;
    };

    return {
      menu, item, save, translate, capitalize, valid, form, saving, isAtLeastOneValueAboveZero, getLocalizedName,
    };
  },
});
</script>
