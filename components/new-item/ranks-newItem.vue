<template>
  <v-form
    ref="form"
    v-model="valid"
    lazy-validation
  >
    <v-text-field
      v-model="rank"
      :label="translate('rank')"
      :rules="rules.rank"
      hide-details="auto"
      :clearable="true"
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
import translate from '@sogebot/ui-helpers/translate';
import { defineComponent, ref } from '@vue/composition-api';
import { v4 as uuid } from 'uuid';

import type { RankInterface } from '.bot/src/bot/database/entity/rank';

export default defineComponent({
  props: { rules: Object },
  setup (_, ctx) {
    const rank = ref('');
    const newItemSaving = ref(false);
    const valid = ref(true);

    const form = ref(null);

    const newItem = () => {
      if ((form.value as unknown as HTMLFormElement).validate()) {
        newItemSaving.value = true;
        const item: RankInterface<null> = {
          id:    uuid(),
          value: 0,
          rank:  rank.value,
          type:  null,
        };
        console.log('Saving', { item });
        ctx.emit('save', item);
        newItemSaving.value = false;
      }
    };

    const closeDlg = () => {
      ctx.emit('close');
    };

    return {
      translate,
      rank,
      newItemSaving,
      newItem,
      valid,
      closeDlg,
      form,
    };
  },
});
</script>
