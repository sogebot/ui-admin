<template>
  <v-card
    :id="id"
    width="100%"
    height="100%"
    :loading="loading"
    style="overflow: inherit"
    flat
  >
    <v-list-item-group
      v-model="checkedItemsIdx"
      multiple
      active-class=""
    >
      <v-list-item v-for="item of items" :key="item">
        <template #default="{ active }">
          <v-list-item-action>
            <v-checkbox :input-value="active" />
          </v-list-item-action>

          <v-list-item-content>
            {{ item }}
          </v-list-item-content>
        </template>
      </v-list-item>
    </v-list-item-group>
  </v-card>
</template>

<script lang="ts">
import { mdiPencil } from '@mdi/js';
import {
  computed,
  defineComponent, onMounted, ref, watch,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { v4 } from 'uuid';

import type { ChecklistInterface } from '.bot/src/database/entity/checklist';

export default defineComponent({
  props: { height: Number },
  setup () {
    const id = v4();

    const isPopout = computed(() => location.href.includes('popout'));
    const loading = ref(true);

    const items = ref([] as string[]);
    const checkedItemsIdx = ref([] as number[]);

    watch(checkedItemsIdx, (indexes) => {
      for (const [idx, item] of items.value.entries()) {
        const checkedItem = {
          id:          item,
          isCompleted: indexes.includes(idx),
        };
        getSocket('/systems/checklist').emit('checklist::save', checkedItem, () => {
          console.log('Checklist item saved', checkedItem);
        });
      }
    });

    const update = () => {
      getSocket('/systems/checklist').emit('generic::getAll', (err: Error | null, itemsFromSocket: string[], checkedItemsFromSocket: ChecklistInterface[]) => {
        if (err) {
          return console.error(err);
        }

        // populate completed
        for (const item of checkedItemsFromSocket) {
          if (item.isCompleted) {
            const idx = itemsFromSocket.indexOf(item.id);
            if (idx > -1) {
              checkedItemsIdx.value.push(idx);
            }
          }
        }
        items.value = itemsFromSocket;
        loading.value = false;
      });
    };

    onMounted(() => {
      update();
    });

    return {
      id,

      // refs
      isPopout,
      items,
      loading,
      checkedItemsIdx,

      // functions

      // helpers
      translate,

      // icons,
      mdiPencil,
    };
  },
});
</script>
