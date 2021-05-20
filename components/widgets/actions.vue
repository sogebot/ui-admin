<template>
  <v-card id="c7eff6a7-dc62-4c0b-bad6-90df9d5b605f" width="100%" height="100%" :loading="loading">
    <v-toolbar color="blue-grey darken-4" class="mb-1" height="36">
      <v-toolbar-title class="text-button">
        Actions
      </v-toolbar-title>
      <v-spacer />
      <v-tooltip v-if="!isPopout" bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            icon
            v-bind="attrs"
            href="#/popout/actions"
            target="_blank"
            v-on="on"
          >
            <v-icon>{{ mdiOpenInNew }}</v-icon>
          </v-btn>
        </template>
        <span>Popout</span>
      </v-tooltip>
      <v-btn icon :color="editing ? 'primary' : 'secondary lighten-2'" @click="editing = !editing">
        <v-icon>{{ mdiCircleEditOutline }}</v-icon>
      </v-btn>
    </v-toolbar>

    <v-row dense>
      <v-col cols="12">
        <template v-for="item of items">
          <span :key="item.id + 'transition'">
            <v-expand-transition>
              <action-button
                v-show="!item.temporary && item.show"
                :key="item.id"
                :item="item"
                :editing="editing"
                @save="refresh"
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
            <v-icon>{{ mdiPlusThick }}</v-icon>
          </v-btn>
          <v-fade-transition>
            <v-btn v-if="isAnySelected" color="error" block @click="deleteItems">
              <v-icon>{{ mdiDelete }}</v-icon>
            </v-btn>
          </v-fade-transition>
        </v-col>
      </v-row>
    </v-fade-transition>
  </v-card>
</template>

<script lang="ts">
import {
  mdiCircleEditOutline, mdiDelete, mdiOpenInNew, mdiPlusThick,
} from '@mdi/js';
import {
  computed,
  defineAsyncComponent,
  defineComponent, onMounted, ref,
} from '@vue/composition-api';
import { v4 } from 'uuid';

import type { QuickActions } from '.bot/src/bot/database/entity/dashboard';
import api from '~/functions/api';
import { error } from '~/functions/error';

export default defineComponent({
  components: { actionButton: defineAsyncComponent({ loader: () => import('~/components/widgets/actions/button.vue') }) },
  setup (_, ctx) {
    const editing = ref(false);
    const height = ref(600);
    const isPopout = computed(() => location.href.includes('popout'));
    const loading = ref(true);

    const selectedItems = computed(() => {
      return items.value.filter(o => o.selected);
    });
    const isAnySelected = computed(() => {
      return selectedItems.value.length > 0;
    });

    const items = ref([] as (QuickActions.Item & { selected: boolean, temporary: boolean, show: boolean })[]);

    function updateHeight () {
      // so. many. parentElement. to get proper offsetTop as children offset is 0
      const offsetTop = document.getElementById('c7eff6a7-dc62-4c0b-bad6-90df9d5b605f')?.parentElement?.parentElement?.parentElement?.parentElement?.offsetTop || 0;
      const offset = 95;
      const newHeight = window.innerHeight - offsetTop - offset;
      height.value = Math.max(newHeight, 500);
    }

    function addItem () {
      items.value.push({
        id:        v4(),
        selected:  false,
        userId:    (ctx.root as any).$store.state.loggedUser.id,
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
        api.delete(ctx.root.$axios, `/api/v1/quickaction/${item.id}`);
      }
      setTimeout(() => {
        items.value = items.value.filter(item => !item.selected);
      }, 1);
    }

    const refresh = async () => {
      if (typeof (ctx.root as any).$store.state.loggedUser === 'undefined' || (ctx.root as any).$store.state.loggedUser === null) {
        setTimeout(() => refresh(), 10);
      } else {
        try {
          const response = await api.get<(QuickActions.Item)[]>(ctx.root.$axios, '/api/v1/quickaction');
          items.value = response.data.data.map(o => ({
            ...o, selected: items.value.find(b => b.id === o.id)?.selected ?? false, temporary: false, show: false,
          }));

          setTimeout(() => {
            ctx.root.$nextTick(() => {
              // set as temporary false to show animation
              for (const item of items.value) {
                item.show = true;
              }
              loading.value = false;
            });
          }, 200);
        } catch (e) {
          error(e);
        }
      }
    };

    onMounted(() => {
      setInterval(() => updateHeight(), 100);
      refresh();
    });

    return {
      /* refs */
      isAnySelected,
      selectedItems,
      editing,
      height,
      items,
      isPopout,
      loading,

      /* functions */
      addItem,
      deleteItems,
      refresh,

      /* icons */
      mdiCircleEditOutline,
      mdiPlusThick,
      mdiDelete,
      mdiOpenInNew,
    };
  },
});
</script>
