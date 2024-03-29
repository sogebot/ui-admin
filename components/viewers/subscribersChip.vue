<template>
  <v-edit-dialog
    persistent
    large
    @open="open"
    @cancel="close"
    @save="save"
  >
    <v-chip
      x-small
      :color="item.isSubscriber ? 'success' : 'error'"
    >
      <v-icon
        v-if="item.haveSubscriberLock"
        x-small
      >
        mdi-lock
      </v-icon>
      Subscriber
    </v-chip>
    <template #input>
      <v-container
        fluid
        style="max-width: fit-content;"
      >
        <v-btn-toggle
          v-model="data"
          class="no-opacity"
          multiple
          dense
        >
          <v-btn
            :color="itemUpdated.haveSubscriberLock ? 'success' : 'error'"
            small
          >
            <v-icon>mdi-lock</v-icon>
          </v-btn>
          <v-btn
            :color="itemUpdated.isSubscriber ? 'success' : 'error'"
            small
          >
            Subscriber
          </v-btn>
        </v-btn-toggle>
      </v-container>
    </template>
  </v-edit-dialog>
</template>
<script lang="ts">
import {
  computed, defineComponent, ref,
} from '@nuxtjs/composition-api';
import { cloneDeep } from 'lodash';

import type { UserInterface } from '@entity/user';

export default defineComponent({
  props: {
    item: Object,
  },
  setup (props: {
    item: UserInterface,
  }, ctx) {
    let itemBackup: UserInterface = cloneDeep(props.item);
    const itemUpdated = ref(cloneDeep(props.item));
    const data = computed<number[]>({
      set (value) {
        itemUpdated.value.haveSubscriberLock = value.includes(0);
        itemUpdated.value.isSubscriber = value.includes(1);
        return true;
      },
      get () {
        const toReturn = [];
        if (itemUpdated.value.haveSubscriberLock) {
          toReturn.push(0);
        }
        if (itemUpdated.value.isSubscriber) {
          toReturn.push(1);
        }
        return toReturn;
      },
    });

    const open = () => {
      itemBackup = cloneDeep(props.item);
    };

    const save = () => {
      ctx.emit('save', itemUpdated.value);
    };

    const close = () => {
      ctx.emit('close');
      itemUpdated.value = itemBackup; // revert
    };

    return {
      itemUpdated,
      close,
      save,
      open,
      data,
    };
  },
});
</script>

<style scoped>
.no-opacity > .v-btn.v-btn {
  opacity: 1 !important;
}
</style>
