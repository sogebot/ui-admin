<template>
  <v-list
    nav
    dense
  >
    <v-list-item
      v-for="item of menu.filter(o => typeof o.category === 'undefined')"
      :key="item.name"
      :to="'/' + item.id.replace(/\./g, '/')"
      nuxt
    >
      <v-list-item-icon>
        <v-icon>{{ icons.get(item.name) }}</v-icon>
      </v-list-item-icon>
      <v-list-item-title>{{ translate('menu.' + item.name) }}</v-list-item-title>
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
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, onMounted, ref,
} from '@vue/composition-api';

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
    const menu = ref([] as menuWithEnabled[]);
    const categories = ['commands', 'manage', 'settings', 'registry', /* 'logs', */ 'stats'];
    const isDisabledHidden = ref(true);

    onMounted(async () => {
      const socket = getSocket('/');
      const isLoaded = await Promise.race([
        new Promise<boolean>((resolve) => {
          socket.emit('menu', (err: string | null, data: menuWithEnabled[]) => {
            if (err) {
              return console.error(err);
            }
            console.groupCollapsed('menu::menu');
            console.log({ data });
            console.groupEnd();
            for (const item of data.sort((a, b) => {
              return translate('menu.' + a.name).localeCompare(translate('menu.' + b.name));
            })) {
              menu.value.push(item);
            }
            resolve(true);
          });
        }),
        new Promise<boolean>((resolve) => {
          setTimeout(() => resolve(false), 4000);
        }),
      ]);

      if (!isLoaded) {
        console.error('menu not loaded, refreshing page');
        location.reload();
      }
    });

    return {
      menu, categories, isDisabledHidden, translate, icons,
    };
  },
});
</script>
