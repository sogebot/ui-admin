<template>
  <v-card id="c7eff6a7-dc62-4c0b-bad6-90df9d5b605f" width="100%" height="100%" :loading="loading" style="overflow: inherit;">
    <v-toolbar color="blue-grey darken-4" class="mb-1" height="36">
      <v-toolbar-title class="text-button">
        Actions
      </v-toolbar-title>
    </v-toolbar>
    <v-speed-dial
      v-model="fab"
      absolute
      right
      style="right: 2px; top: -15px;"
      direction="bottom"
      top
    >
      <template #activator>
        <v-btn v-model="fab" color="blue-grey darken-2" dark fab x-small>
          <v-icon v-if="fab">
            mdi-close
          </v-icon>
          <v-icon v-else>
            mdi-dots-vertical
          </v-icon>
        </v-btn>
      </template>

      <v-btn fab x-small :color="editing ? 'primary' : 'secondary lighten-2'" @click="editing = !editing">
        <v-icon>mdi-circle-edit-outline</v-icon>
      </v-btn>
      <v-tooltip v-if="!isPopout" bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            color="secondary"
            fab
            x-small
            v-bind="attrs"
            href="#/popout/actions"
            target="_blank"
            v-on="on"
          >
            <v-icon>mdi-open-in-new</v-icon>
          </v-btn>
        </template>
        <span>Popout</span>
      </v-tooltip>
    </v-speed-dial>

    <v-row :key="timestamp" dense>
      <v-col cols="12">
        <template v-for="item of items">
          <span :key="item.id + 'transition'">
            <v-expand-transition>
              <widgets-actions-button
                v-show="!item.temporary && item.show"
                :key="item.id"
                :item="item"
                :editing="editing"
                @save="refetch"
                @selected="item.selected = $event"
              />
            </v-expand-transition>
          </span>
        </template>
      </v-col>
    </v-row>
    <v-fade-transition>
      <v-row v-if="editing">
        <v-col cols="12">
          <v-btn color="success" block @click="addItem">
            <v-icon>mdi-plus</v-icon>
          </v-btn>
          <v-fade-transition>
            <v-btn v-if="isAnySelected" color="error" block @click="deleteItems">
              <v-icon>mdi-delete-forever</v-icon>
            </v-btn>
          </v-fade-transition>
        </v-col>
      </v-row>
    </v-fade-transition>
  </v-card>
</template>

<script setup lang="ts">
import type { QuickActions } from '@entity/dashboard';
import gql from 'graphql-tag';
import { v4 } from 'uuid';

import { error } from '~/functions/error';
import { omitDeep } from '~/functions/omitDeep';

const { $graphql, $store } = useNuxtApp();

const loading = ref(true);
const items = ref([] as (QuickActions.Item & { selected: boolean, temporary: boolean, show: boolean })[]);

const refetch = async () => {
  const request = await $graphql.default.request(gql`
      query quickAction {
        quickAction {
          ... on CommandItem { id userId type order options { label color command }  }
          ... on CustomVariableItem { id userId type order options { label color customvariable } }
          ... on RandomizerItem { id userId type order options { label color randomizerId } }
          ... on OverlayCountdownItem { id userId type order options { label color countdownId } }
          ... on OverlayMarathonItem { id userId type order options { label color marathonId } }
          ... on OverlayStopwatchItem { id userId type order options { label color stopwatchId } }
        }
      }
    `);
  items.value = request.quickAction.map((o: any) => {
    const item = omitDeep(o, ['__typename']);
    return {
      ...item, selected: items.value.find(b => b.id === item.id)?.selected ?? false, temporary: false, show: true,
    };
  });
  loading.value = false;
};

const fab = ref(false);
const editing = ref(false);
const timestamp = ref(Date.now());
const height = ref(600);
const isPopout = computed(() => location.href.includes('popout'));

const selectedItems = computed(() => {
  return items.value.filter(o => o.selected);
});
const isAnySelected = computed(() => {
  return selectedItems.value.length > 0;
});

function updateHeight () {
  // so. many. parentElement. to get proper offsetTop as children offset is 0
  const offsetTop = document.getElementById('c7eff6a7-dc62-4c0b-bad6-90df9d5b605f')?.parentElement?.parentElement?.parentElement?.parentElement?.offsetTop || 0;
  const offset = 90;
  const newHeight = window.innerHeight - offsetTop - offset;
  height.value = Math.max(newHeight, 500);
}
function addItem () {
  items.value.push({
    id:        v4(),
    selected:  false,
    userId:    $store.state.loggedUser.id,
    order:     -1,
    temporary: true,
    show:      true,
    type:      'command',
    options:   {
      label:   '',
      color:   'blue',
      command: '',
    },
  });
}

function deleteItems () {
  const selected = items.value.filter(item => item.selected);
  for (const item of selected) {
    item.show = false;
    $graphql.default.request(gql`
          mutation quickActionDelete($id: String!) {
            quickActionDelete(id: $id)
          }`, { id: item.id }).catch(e => error(e));
  }
  setTimeout(() => {
    items.value = items.value.filter(item => !item.selected);
  }, 1);
}

onMounted(() => {
  refetch();
  setInterval(() => updateHeight(), 100);
});
</script>
