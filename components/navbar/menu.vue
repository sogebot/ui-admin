<template>
  <v-list
    nav
    dense
  >
    <v-list-item
      v-for="item of menu.filter(o => o.category === 'main')"
      :key="item.name"
      :to="'/' + item.id.replace(/\./g, '/')"
      nuxt
    >
      <v-list-item-icon>
        <v-icon>{{ icons.get(item.name) }}</v-icon>
      </v-list-item-icon>
      <v-list-item-title>{{ translate(item.name) }}</v-list-item-title>
    </v-list-item>
    <v-list-group
      v-for="category of categories"
      :key="category"
      :value="false"
      :prepend-icon="icons.get(category)"
    >
      <template #activator>
        <v-list-item-title>{{ translate('menu.' + category) }}</v-list-item-title>
      </template>

      <v-list-item
        v-for="item of menu.filter(o => o.category === category)"
        :key="item.name"
        :to="'/' + item.id.replace(/\./g, '/')"
        nuxt
      >
        <v-list-item-title
          :class="{
            'grey--text': !item.enabled,
            'darken-3': !item.enabled,
          }"
        >
          {{ translate('menu.' + item.name) }}
        </v-list-item-title>
      </v-list-item>
    </v-list-group>
  </v-list>
</template>

<script lang="ts">
import {
  mdiCog, mdiExclamationThick, mdiFormatListBulletedSquare, mdiInformationVariant, mdiViewDashboard, mdiWrench,
} from '@mdi/js';
import { defineComponent, ref } from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';
import { useQuery, useResult } from '@vue/apollo-composable';
import gql from 'graphql-tag';

type menuType = { category?: string; name: string; id: string; this: any | null }[];
type menuWithEnabled = Omit<menuType[number], 'this'> & { enabled: boolean };

const icons = new Map<string, string>([
  ['dashboard', mdiViewDashboard],
  ['commands', mdiExclamationThick],
  ['settings', mdiCog],
  ['manage', mdiWrench],
  ['stats', mdiInformationVariant],
  ['registry', mdiFormatListBulletedSquare],
]);

export default defineComponent({
  setup () {
    const { result } = useQuery(gql`
      query getPrivateMenu { menuPrivate { id name enabled category } }
    `);
    const menu = useResult<{ menuPrivate: menuWithEnabled[] }, menuWithEnabled[], menuWithEnabled[]>(result, [], (data) => {
      console.groupCollapsed('menu::menu');
      console.log({ menu: data.menuPrivate });
      console.groupEnd();
      return data.menuPrivate.sort((a, b) => {
        return translate('menu.' + a.name).localeCompare(translate('menu.' + b.name));
      });
    });
    const categories = ['commands', 'manage', 'settings', 'registry', /* 'logs', */ 'stats'];
    const isDisabledHidden = ref(true);

    return {
      menu, categories, isDisabledHidden, translate, icons,
    };
  },
});
</script>
