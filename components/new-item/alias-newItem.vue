<template>
  <v-form
    ref="form"
    v-model="valid"
    lazy-validation
  >
    <v-text-field
      v-model="newItemAlias"
      :label="translate('alias')"
      :rules="rules.alias"
      hide-details="auto"
      :clearable="true"
      required
      counter
    />

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
import { defaultPermissions } from '@sogebot/ui-helpers/permissions/defaultPermissions';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { defineComponent, ref } from '@vue/composition-api';
import { v4 as uuid } from 'uuid';

import type { AliasInterface } from '.bot/src/bot/database/entity/alias';

const socket = { alias: getSocket('/systems/alias') } as const;

export default defineComponent({
  props: { rules: Object },
  setup (_, ctx) {
    const newItemAlias = ref('');
    const newItemCommand = ref('');
    const newItemSaving = ref(false);
    const valid = ref(true);

    const form = ref(null);

    const newItem = async () => {
      if ((form.value as unknown as HTMLFormElement).validate()) {
        newItemSaving.value = true;
        await new Promise((resolve) => {
          const item: AliasInterface = {
            id:         uuid(),
            alias:      newItemAlias.value,
            command:    newItemCommand.value,
            enabled:    true,
            visible:    true,
            permission: defaultPermissions.VIEWERS,
            group:      null,
          };
          console.log('Saving', { item });
          socket.alias.emit('generic::setById', { id: item.id, item }, () => {
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
      newItemAlias,
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

<style>
tr:nth-of-type(odd) {
  background-color: rgba(0, 0, 0, 0.05);
}
</style>
