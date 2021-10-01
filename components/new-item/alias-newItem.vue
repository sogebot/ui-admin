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
import {
  defineComponent, ref, useContext,
} from '@nuxtjs/composition-api';
import { defaultPermissions } from '@sogebot/ui-helpers/permissions/defaultPermissions';
import translate from '@sogebot/ui-helpers/translate';
import { v4 as uuid } from 'uuid';

import api from '../../functions/api';
import { error } from '../../functions/error';

import type { AliasInterface } from '.bot/src/database/entity/alias';

export default defineComponent({
  props: { rules: Object },
  setup (_, ctx) {
    const newItemAlias = ref('');
    const newItemCommand = ref('');
    const newItemSaving = ref(false);
    const { $axios } = useContext();
    const valid = ref(true);

    const form = ref(null);

    const newItem = async () => {
      if ((form.value as unknown as HTMLFormElement).validate()) {
        newItemSaving.value = true;
        await new Promise((resolve) => {
          const id = uuid();
          const data: AliasInterface = {
            alias:      newItemAlias.value,
            command:    newItemCommand.value,
            enabled:    true,
            visible:    true,
            permission: defaultPermissions.VIEWERS,
            group:      null,
          };
          console.log('Saving', { data });
          const query = `mutation setAlias($id: String!, $data: AliasInput!) {
              setAlias(id: $id, data: $data) {
                id
              }
            }`;
          api.gql<any>($axios, query, {
            id,
            data,
          }).then(() => ctx.emit('save')).catch(error).finally(() => resolve(true));
        });
        newItemSaving.value = false;
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
