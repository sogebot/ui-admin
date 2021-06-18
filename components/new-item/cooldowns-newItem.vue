<template>
  <v-form
    ref="form"
    v-model="valid"
    lazy-validation
  >
    <v-textarea
      v-model="newItemCommand"
      hide-details="auto"
      :label="'!' + translate('command') + ', ' + translate('keyword') + ' ' + translate('or') + ' g:' + translate('group')"
      :rows="1"
      :rules="rules.name"
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

import type { CooldownInterface } from '.bot/src/bot/database/entity/cooldown';

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
          const item: CooldownInterface = {
            id:                   uuid(),
            name:                 newItemCommand.value,
            miliseconds:          60000,
            type:                 'global',
            isErrorMsgQuiet:      false,
            isEnabled:            true,
            isOwnerAffected:      false,
            isModeratorAffected:  false,
            isSubscriberAffected: false,
            isFollowerAffected:   false,
          };
          console.log('Saving', { item });
          getSocket('/systems/cooldown').emit('cooldown::save', item, () => {
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
