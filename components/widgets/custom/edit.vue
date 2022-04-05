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
          <v-icon>mdi-close</v-icon>
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
            mdi-floppy
          </v-icon>
          <span class="d-none d-sm-flex">{{ translate('dialog.buttons.saveChanges.idle') }}</span>
        </v-btn>
      </v-toolbar>
      <v-card-text class="pa-0">
        <v-alert
          border="left"
          color="red"
          icon="mdi-exclamation-thick"
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
                <v-icon>mdi-delete-forever</v-icon>
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

<script setup lang="ts">
import { WidgetCustomInterface } from '@entity/widget';
import translate from '@sogebot/ui-helpers/translate';
import gql from 'graphql-tag';
import { v4 } from 'uuid';

const { $graphql } = useNuxtApp();
const props = defineProps<{
  dialog: boolean,
}>();

const loading = ref(true);
const items = ref([] as Pick<WidgetCustomInterface, 'id' | 'url' | 'name'>[]);
const refetch = async () => {
  items.value = (await $graphql.default.request(gql`
      query widgetCustomGetInEdit { widgetCustomGet { id url name } }
    `)).widgetCustomGet;
  loading.value = false;
};

const dialogController = ref(props.dialog);
const markedToDelete = ref([] as string[]);

watch(dialogController, (val) => {
  ctx.emit('update:dialog', val);
});

const save = () => {
  markedToDelete.value.forEach((id) => {
    $graphql.default.request(gql`mutation widgetCustomRemove($id: String!) { widgetCustomRemove(id: $id) }`,
      { id });
  });
  items.value.forEach((item) => {
    const { id, name, url } = item;
    $graphql.default.request(gql`
      mutation widgetCustomSet($id: String!, $data: WidgetCustomInput!) {
          widgetCustomSet(id: $id, data: $data) {
            id
          }
        }`, {
      id,
      data: { name, url },
    });
  });
  markedToDelete.value = [];
  dialogController.value = false;
  ctx.emit('save');
  refetch();
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
</script>
