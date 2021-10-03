<template>
  <v-dialog
    v-model="dialogController"
    persistent

    :fullscreen="$vuetify.breakpoint.mobile"
    transition="dialog-bottom-transition"
    max-width="600"
  >
    <v-card :loading="loading">
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
          small
          :text="!$vuetify.breakpoint.xs"
          :icon="$vuetify.breakpoint.xs"
          :loading="saving || removing"
          @click="save"
        >
          <v-icon class="d-flex d-sm-none">
            {{ mdiFloppy }}
          </v-icon>
          <span class="d-none d-sm-flex">{{ translate('dialog.buttons.saveChanges.idle') }}</span>
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
  mdiClose, mdiDelete, mdiExclamationThick, mdiFloppy,
} from '@mdi/js';
import {
  defineComponent, ref, watch,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';
import { useMutation, useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { v4 } from 'uuid';

import { error } from '../../../functions/error';

import { WidgetCustomInterface } from '~/.bot/src/database/entity/widget';

type Props = {
  dialog: boolean,
};

export default defineComponent({
  props: { dialog: Boolean },
  setup (props: Props, ctx) {
    const { loading, onError, refetch, onResult } = useQuery(gql`
      query widgetCustomGetInEdit { widgetCustomGet { id url name } }
    `);
    onResult((value) => {
      items.value = value.data.widgetCustomGet;
    });
    onError(error);
    const items = ref([] as Pick<WidgetCustomInterface, 'id' | 'url' | 'name'>[]);

    const { mutate: updateMutation, onDone: onDoneUpdate, onError: onErrorUpdate, loading: saving } = useMutation(gql`
      mutation widgetCustomSet($id: String!, $data: WidgetCustomInput!) {
          widgetCustomSet(id: $id, data: $data) {
            id
          }
        }`);
    onDoneUpdate(() => {
      ctx.emit('save');
      refetch();
    });
    onErrorUpdate(error);
    const { mutate: removeMutation, onDone: onDoneRemove, onError: onErrorRemove, loading: removing } = useMutation(gql`
      mutation widgetCustomRemove($id: String!) { widgetCustomRemove(id: $id) }`);
    onDoneRemove(() => {
      ctx.emit('save');
      refetch();
    });
    onErrorRemove(error);

    const dialogController = ref(props.dialog);
    const valid = ref(true);
    const markedToDelete = ref([] as string[]);

    watch(dialogController, (val) => {
      ctx.emit('update:dialog', val);
    });

    const save = () => {
      markedToDelete.value.forEach((id) => {
        removeMutation({ id });
      });
      items.value.forEach((item) => {
        const { id, name, url } = item;
        updateMutation({ id, data: { name, url } });
      });
      markedToDelete.value = [];
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

    return {
      // refs
      dialogController,
      items,
      valid,
      loading,
      saving,
      removing,

      // functions
      translate,
      save,
      addItem,
      rmItem,

      // icons
      mdiClose,
      mdiDelete,
      mdiExclamationThick,
      mdiFloppy,
    };
  },
});
</script>
