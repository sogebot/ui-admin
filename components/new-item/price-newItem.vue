<template>
  <v-form
    ref="form"
    v-model="valid"
    lazy-validation
  >
    <v-textarea
      v-model="newItemCommand"
      hide-details="auto"
      :label="translate('command')"
      :rows="1"
      :rules="rules.command"
      counter
      :clearable="true"
      auto-grow
      required
      @keydown.enter.prevent
    />

    <v-btn
      class="mr-4"
      :loading="newItemSaving"
      :disabled="!valid"
      @click="newItem"
    >
      submit
    </v-btn>

    <v-btn
      class="mr-4"
      @click="closeDlg"
    >
      close
    </v-btn>
  </v-form>
</template>

<script lang="ts">
import { defineComponent, ref } from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { v4 as uuid } from 'uuid';

import type { PriceInterface } from '.bot/src/database/entity/price';

export default defineComponent({
  props: { rules: Object },
  setup (_, ctx) {
    const newItemCommand = ref('');
    const newItemSaving = ref(false);
    const valid = ref(true);

    const form = ref(null);

    const newItem = async () => {
      if ((form.value as unknown as HTMLFormElement).validate()) {
        newItemSaving.value = true;
        await new Promise((resolve) => {
          const item: PriceInterface = {
            id:              uuid(),
            command:         newItemCommand.value,
            priceBits:       0,
            price:           100,
            enabled:         true,
            emitRedeemEvent: false,
          };
          console.log('Saving', { item });
          getSocket('/systems/price').emit('price::save', item, () => {
            resolve(true);
            ctx.emit('save');
            newItemSaving.value = false;
          });
        });
      }
    };

    const closeDlg = () => {
      ctx.emit('close');
    };

    return {
      translate,
      newItemCommand,
      newItemSaving,
      newItem,
      valid,
      closeDlg,
      form,
    };
  },
});
</script>
