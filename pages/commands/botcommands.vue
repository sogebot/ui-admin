<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <v-data-table v-model="selected" :loading="state.loading !== ButtonStates.success || loading" :headers="headers"
      :items-per-page="-1" :items="fItems" sort-by="name" group-by="type">
      <template #top>
        <v-sheet flat color="dark" class="my-2 pb-2 mt-0">
          <v-row class="px-2" dense>
            <v-col align-self="center">
              <v-text-field v-model="search" :append-icon="mdiMagnify" label="Search" single-line hide-details
                class="pa-0 ma-2" />
            </v-col>
          </v-row>
        </v-sheet>
      </template>

      <template #[`group.header`]="{ items, isOpen, toggle }">
        <th colspan="7">
          <v-icon @click="toggle">
            {{ isOpen ? mdiMinus : mdiPlus }}
          </v-icon>

          {{ items[0].type }}
        </th>
      </template>

      <template #[`item.actions`]="{ item }">
        <v-row dense justify="end" align="center">
          <v-col cols="auto">
            <botcommands-edit :rules="rules" :value="item" :permission-items="permissionItems" @save="refresh()" />
          </v-col>
        </v-row>
      </template>

      <template #[`item.command`]="{ item }">
        <span
          :class="{ 'text-decoration-line-through': item.command !== item.defaultValue }">{{ item.defaultValue }}</span>
        <span v-if="item.command !== item.defaultValue">
          <v-icon class="d-inline-block">{{ mdiArrowRightBold }}</v-icon> {{ item.command }}
        </span>
      </template>

      <template #[`item.permission`]="{ item }">
        <span :class="{ 'text--lighten-1':item.permission === null, 'red--text': item.permission === null }">
          {{ item.permission === null ? '-- unset --' : getPermissionName(item.permission, permissions) }}
        </span>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import {
  mdiArrowRightBold, mdiMagnify, mdiMinus, mdiPlus,
} from '@mdi/js';
import {
  computed, defineAsyncComponent, defineComponent, onMounted, ref,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { useQuery, useResult } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { capitalize, orderBy } from 'lodash';

import type { PermissionsInterface } from '.bot/src/database/entity/permissions';
import { error } from '~/functions/error';
import { getPermissionName } from '~/functions/getPermissionName';
import {
  minLength, required, startsWith,
} from '~/functions/validators';

type CommandsInterface = {
  id: string,
  defaultValue: string,
  type: string,
  name: string,
  command: string,
  permission: string | null,
};

export default defineComponent({
  components: {
    'botcommands-edit': defineAsyncComponent(() => import('~/components/manage/botcommands/edit.vue')),
  },
  setup () {
    const { result, loading } = useQuery(gql`
      query {
        permissions { id name }
      }
    `);
    const permissions = useResult<{permissions: PermissionsInterface[] }, PermissionsInterface[], PermissionsInterface[]>(result, [], data => data.permissions);
    const rules = {
      command: [startsWith(['!']), required, minLength(2)],
    };

    const search = ref('');
    const items = ref([] as CommandsInterface[]);

    const selected = ref([] as CommandsInterface[]);

    const state = ref({
      loading: ButtonStates.progress,
    } as {
      loading: number;
    });

    const fItems = computed(() => {
      if (search.value === '') {
        return items.value;
      } else {
        return items.value.filter((item) => {
          const inCommand = item.command.toLowerCase().includes(search.value.toLowerCase());
          const inOriginal = item.defaultValue.toLowerCase().includes(search.value.toLowerCase());
          const inName = item.name.toLowerCase().includes(search.value.toLowerCase());
          return inOriginal || inCommand || inName;
        });
      }
    });

    const headers = [
      {
        value: 'actions', width: '3rem', sortable: false,
      },
      {
        value: 'command', text: translate('command'),
      },
      {
        value: 'type', text: capitalize(translate('type')),
      },
      {
        value: 'name', text: capitalize(translate('name')),
      },
      {
        value: 'permission', text: translate('permission'),
      },
    ];

    const refresh = () => {
      getSocket('/core/general').emit('generic::getCoreCommands', (err: string | null, commands: Required<CommandsInterface>[]) => {
        if (err) {
          return error(err);
        }
        console.debug({
          commands,
        });
        items.value.length = 0;
        for (const command of commands) {
          items.value.push({
            ...command,
          });
        }
        // we also need to reset selection values
        if (selected.value.length > 0) {
          selected.value.forEach((selectedItem, index) => {
            selectedItem = items.value.find(o => o.id === selectedItem.id) || selectedItem;
            selected.value[index] = selectedItem;
          });
        }
        state.value.loading = ButtonStates.success;
      });
    };

    onMounted(() => {
      refresh();
    });

    const permissionItems = computed(() => {
      return [...permissions.value, {
        name: 'Disabled', id: null,
      }].map(item => ({
        text:     item.name,
        value:    item.id,
        disabled: false,
      }));
    });

    return {
      orderBy,
      headers,
      search,
      items,
      loading,
      state,
      permissionItems,
      permissions,
      getPermissionName,
      selected,
      translate,
      rules,
      refresh,
      capitalize,
      fItems,
      mdiMagnify,
      mdiPlus,
      mdiMinus,
      mdiArrowRightBold,
      ButtonStates,
    };
  },
});
</script>
