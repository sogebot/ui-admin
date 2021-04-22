<template>
  <v-form
    ref="form"
    v-model="valid"
    lazy-validation
  >
    <v-text-field
      v-model="name"
      :label="capitalize(translate('timers.dialog.name'))"
      hide-details="auto"
      :rules="rules.name"
      required
      counter
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
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { defineComponent, ref } from '@vue/composition-api';
import { capitalize } from 'lodash-es';
import { v4 as uuid } from 'uuid';

import type { TimerInterface } from '.bot/src/bot/database/entity/timer';

export default defineComponent({
  props: { rules: Object },
  setup (_, ctx) {
    const name = ref('');

    const newItemSaving = ref(false);
    const valid = ref(true);

    const form = ref(null);

    const newItem = async () => {
      if ((form.value as unknown as HTMLFormElement).validate()) {
        newItemSaving.value = true;
        await new Promise((resolve) => {
          const item: TimerInterface = {
            id:                  uuid(),
            name:                name.value,
            isEnabled:           true,
            tickOffline:         false,
            triggerEveryMessage: 10,
            triggerEverySecond:  300,
            messages:            [],
          };
          console.log('Saving', { item });
          getSocket('/systems/timers').emit('generic::setById', { id: item.id, item }, () => {
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
      name,
      translate,
      newItemSaving,
      newItem,
      valid,
      closeDlg,
      form,
      capitalize,
    };
  },
});
</script>
