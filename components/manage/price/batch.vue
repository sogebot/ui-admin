<template>
  <div>
    <v-menu
      v-model="menu"
      offset-y
      :close-on-click="false"
      min-width="400"
      :close-on-content-click="false"
      offset-overflow
    >
      <template #activator="{ on, attrs }">
        <v-btn v-bind="attrs" small v-on="on">
          Batch update
        </v-btn>
      </template>
      <v-card outlined>
        <v-card-text>
          <v-form v-model="valid" lazy-validation>
            <v-row no-gutters>
              <v-col cols="auto" align-self="center">
                <v-checkbox v-model="toggles" value="enabled" />
              </v-col>
              <v-col>
                <v-switch
                  :disabled="!toggles.includes('enabled')"
                  v-model="enabled"
                  :label="translate('enabled')"
                  persistent-hint
                  hide-details="auto"
                  :hint="(enabled
                    ? 'Price is enabled.'
                    : 'Price is disabled.')"
                />
              </v-col>
            </v-row>

            <v-row no-gutters>
              <v-col cols="auto" align-self="center">
                <v-checkbox v-model="toggles" value="emitRedeemEvent" />
              </v-col>
              <v-col>
                <v-switch
                  :disabled="!toggles.includes('emitRedeemEvent')"
                  v-model="emitRedeemEvent"
                  :label="capitalize(translate('systems.price.emitRedeemEvent'))"
                  persistent-hint
                  hide-details="auto"
                  :hint="(emitRedeemEvent
                    ? 'If price is paid, redeem event / alert will be triggered.'
                    : 'No event will be triggered.')"
                />
              </v-col>
            </v-row>

            <v-row no-gutters>
              <v-col cols="auto" align-self="center">
                <v-checkbox v-model="toggles" value="price" />
              </v-col>
              <v-col>
                <v-text-field
                  v-model.number="price"
                  class="d-inline-block"
                  type="number"
                  :rules="rules.price"
                  single-line
                >
                  <template #append>
                    {{ getLocalizedName(2, $store.state.configuration.systems.Points.customization.name) }}
                  </template>
                </v-text-field>
              </v-col>
            </v-row>

            <v-row no-gutters>
              <v-col cols="auto" align-self="center">
                <v-checkbox v-model="toggles" value="priceBits" />
              </v-col>
              <v-col>
                <v-text-field
                  v-model.number="priceBits"
                  class="d-inline-block"
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
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />

          <v-btn text @click="menu = false">
            Cancel
          </v-btn>
          <v-btn color="primary" text :disabled="!valid" @click="save()">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </div>
</template>

<script lang="ts">

import { getLocalizedName } from '@sogebot/ui-helpers/getLocalized';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, ref, watch,
} from '@vue/composition-api';
import capitalize from 'lodash/capitalize';

type Props = {
  length: number;
};

export default defineComponent({
  props: {
    length: Number,
    rules:  Object,
  },
  setup (props: Props, ctx) {
    const menu = ref(false);
    const valid = ref(true);

    watch(menu, (val) => {
      if (val) {
        toggles.value = [];
      }
    });

    const toggles = ref([] as string[]);

    const enabled = ref(false);
    const emitRedeemEvent = ref(false);
    const price = ref(0);
    const priceBits = ref(0);

    const save = () => {
      ctx.emit('save', {
        enabled: toggles.value.includes('enabled')
          ? enabled.value
          : undefined,
        emitRedeemEvent: toggles.value.includes('emitRedeemEvent')
          ? emitRedeemEvent.value
          : undefined,
        price: toggles.value.includes('price')
          ? price.value
          : undefined,
        priceBits: toggles.value.includes('priceBits')
          ? priceBits.value
          : undefined,
      });
      menu.value = false;
    };

    return {
      toggles,
      enabled,
      emitRedeemEvent,
      price,
      priceBits,
      getLocalizedName,

      menu,
      save,
      translate,
      capitalize,
      valid,
    };
  },
});
</script>
