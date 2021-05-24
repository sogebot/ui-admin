<template>
  <v-dialog
    v-model="dialogController"
    persistent
    :fullscreen="$vuetify.breakpoint.mobile"
    transition="dialog-bottom-transition"
    max-width="600"
  >
    <v-card :loading="!isLoaded">
      <v-toolbar dense color="dark">
        <v-btn
          icon
          @click="dialogController = false"
        >
          <v-icon>{{ mdiClose }}</v-icon>
        </v-btn>
        <span class="headline">Edit custom URLs</span>
        <v-spacer />
        <v-btn
          text
          :loading="isSaving"
          :disabled="!valid"
          @click="save"
        >
          {{ translate('dialog.buttons.saveChanges.idle') }}
        </v-btn>
      </v-toolbar>
      <v-card-text class="pa-0">
        <v-alert
          border="left"
          color="red"
          :icon="mdiExclamationThick"
          text
          type="success"
        >
          Not all URLs will be working! e.g twitter.com, reddit.com have forbidden iframes.
        </v-alert>
        <v-list>
          <transition-group name="fade">
            <v-list-item v-for="item of items" :key="item.id">
              <v-text-field
                v-model="item.name"
                label="Name"
              />
              <v-text-field
                v-model="item.url"
                label="URL"
              />
              <v-btn color="error" icon @click="rmItem(item.id)">
                <v-icon>{{ mdiDelete }}</v-icon>
              </v-btn>
            </v-list-item>
          </transition-group>
        </v-list>
      </v-card-text>
      <v-card-actions>
        <v-btn
          text
          @click="addItem"
        >
          Add new item
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import {
  mdiClose, mdiDelete, mdiExclamationThick,
} from '@mdi/js';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';
import { v4 } from 'uuid';

import { WidgetCustomInterface } from '~/.bot/src/bot/database/entity/widget';
import api from '~/functions/api';

type Props = {
  dialog: boolean,
};

export default defineComponent({
  props: { dialog: Boolean },
  setup (props: Props, ctx) {
    const dialogController = ref(props.dialog);
    const isLoaded = ref(false);
    const isSaving = ref(false);
    const items = ref([] as Omit<WidgetCustomInterface, 'userId'>[]);
    const valid = ref(true);
    const markedToDelete = ref([] as string[]);

    watch(dialogController, (val) => {
      ctx.emit('update:dialog', val);
    });

    const refresh = async () => {
      const response = await api.get<WidgetCustomInterface[]>(ctx.root.$axios, `/api/v1/custom`);
      items.value = response.data.data;
      isLoaded.value = true;
    };

    const save = async () => {
      isSaving.value = true;
      for (const id of markedToDelete.value) {
        api.delete<WidgetCustomInterface>(ctx.root.$axios, `/api/v1/custom/${id}`).catch(() => {
          return true;
        });
      }
      for (const item of items.value) {
        await api.post<Omit<WidgetCustomInterface, 'userId'>>(ctx.root.$axios, `/api/v1/custom`, item);
      }
      markedToDelete.value = [];
      isSaving.value = false;
      dialogController.value = false;
    };

    const addItem = () => {
      items.value.push({
        id:   v4(),
        name: '',
        url:  '',
      });
    };

    const rmItem = (id: string) => {
      items.value = items.value.filter(o => o.id !== id);
      markedToDelete.value.push(id);
    };

    onMounted(() => {
      refresh();
    });

    return {
      // refs
      dialogController,
      isLoaded,
      isSaving,
      items,
      valid,

      // functions
      translate,
      save,
      addItem,
      rmItem,

      // icons
      mdiClose,
      mdiDelete,
      mdiExclamationThick,
    };
  },
});
</script>
