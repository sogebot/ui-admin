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
      :loading="loading"
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
import { defaultPermissions } from '@sogebot/ui-helpers/permissions/defaultPermissions';
import translate from '@sogebot/ui-helpers/translate';
import { useMutation } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { v4 as uuid } from 'uuid';

import { error } from '../../functions/error';

import type { AliasInterface } from '.bot/src/database/entity/alias';

export default defineComponent({
  props: { rules: Object },
  setup (_, ctx) {
    const newItemAlias = ref('');
    const newItemCommand = ref('');
    const valid = ref(true);

    const { mutate: updateMutation, onDone: onDoneUpdate, onError: onErrorUpdate, loading } = useMutation(gql`
      mutation setAlias($id: String!, $data: AliasInput!) {
        setAlias(id: $id, data: $data) {
          id
        }
      }`);
    onDoneUpdate(() => ctx.emit('save'));
    onErrorUpdate(error);

    const form = ref(null);

    const newItem = () => {
      if ((form.value as unknown as HTMLFormElement).validate()) {
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
        updateMutation({
          id,
          data,
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
      newItem,
      valid,
      closeDlg,
      form,
      loading,
    };
  },
});
</script>
