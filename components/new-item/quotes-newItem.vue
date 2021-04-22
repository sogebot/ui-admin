<template>
  <v-form
    ref="form"
    v-model="valid"
    lazy-validation
  >
    <v-textarea
      v-model="quote"
      :label="capitalize(translate('systems.quotes.quote.name'))"
      :rules="rules.quote"
      hide-details="auto"
      required
      counter
    />
    <v-text-field
      v-model="quotedBy"
      :readonly="true"
      :disabled="true"
      :loading="quotedBy === ''"
      :label="capitalize(translate('systems.quotes.by.name'))"
      hide-details="auto"
      required
      counter
    />
    <v-combobox
      v-model="tagsInput"
      :label="capitalize(translate('systems.quotes.tags.name'))"
      hide-selected
      small-chips
      clearable
      :search-input.sync="tagsSearch"
      :return-object="false"
      multiple
      dense
      :items="tags"
    >
      <template #no-data>
        <v-list-item>
          <span class="subheading">Add new tag</span>
          <strong class="pl-2">{{ tagsSearch }}</strong>
        </v-list-item>
      </template>
    </v-combobox>

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
import { getUsernameById } from '@sogebot/ui-helpers/userById';
import {
  defineComponent, onMounted, ref,
} from '@vue/composition-api';
import { capitalize } from 'lodash-es';

import type { QuotesInterface } from '.bot/src/bot/database/entity/quotes';

export default defineComponent({
  props: { tags: Array, rules: Object },
  setup (_, ctx) {
    const quote = ref('');
    const tagsInput = ref([] as string[]);
    const quotedBy = ref('');
    const tagsSearch = ref('');

    onMounted(async () => {
      quotedBy.value = await getUsernameById(ctx.root.$store.state.loggedUser.id);
    });
    const newItemSaving = ref(false);
    const valid = ref(true);

    const form = ref(null);

    const newItem = async () => {
      if ((form.value as unknown as HTMLFormElement).validate()) {
        newItemSaving.value = true;
        await new Promise((resolve) => {
          const item: QuotesInterface = {
            id:        undefined,
            createdAt: Date.now(),
            tags:      tagsInput.value,
            quotedBy:  ctx.root.$store.state.loggedUser.id,
            quote:     quote.value,
          };
          console.log('Saving', { item });
          getSocket('/systems/quotes').emit('generic::setById', { id: item.id, item }, () => {
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
      tagsSearch,
      quote,
      tagsInput,
      newItemSaving,
      newItem,
      valid,
      closeDlg,
      form,
      capitalize,
      quotedBy,
    };
  },
});
</script>
