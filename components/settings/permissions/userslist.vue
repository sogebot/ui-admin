<template>
  <v-autocomplete
    v-model="model"
    :label="label"
    :search-input.sync="search"
    :items="searchItems"
    hide-no-data
    placeholder="Start typing to Search"
    multiple
    item-text="username"
    item-value="userId"
    :loading="isLoading"
    chips
    small-chips
    cache-items
    deletable-chips
  />
</template>

<script lang="ts">
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';
import { v4 } from 'uuid';

import { UserInterface } from '~/.bot/src/bot/database/entity/user';

export default defineComponent({
  props: { value: Array, label: String },
  setup (props: { value: string[] }, ctx) {
    const model = ref(props.value);
    const search = ref('');
    const searchItems = ref([] as { userId: string, username: string }[]);
    const isLoading = ref(false);

    onMounted(() => {
      isLoading.value = false;
      Promise.allSettled(
        model.value.map((userId) => {
          return new Promise((resolve) => {
            getSocket('/core/users').emit('getNameById', userId, (err: string | null, username: string) => {
              if (err) {
                return console.error(err);
              }
              searchItems.value.push({ userId, username });
              resolve(true);
            });
          });
        }),
      ).then(() => (isLoading.value = false));
    });

    watch(model, (val) => {
      ctx.emit('input', val);
    });

    watch(search, (val) => {
      isLoading.value = true;
      const state = v4();

      if (!val || val.trim().length === 0) {
        isLoading.value = false;
      } else {
        getSocket('/core/users').emit('find.viewers', {
          search: val, state, exactUsernameFromTwitch: true,
        }, (err: string | null, r: UserInterface[], _count: any, state2: string) => {
          if (err) {
            return console.error(err);
          }
          if (state === state2) {
            // expecting this data
            searchItems.value = r;
            isLoading.value = false;
          }
        });
      }
    });

    return {
      // refs
      model,
      search,
      isLoading,
      searchItems,

      // others
      translate,
    };
  },
});
</script>
