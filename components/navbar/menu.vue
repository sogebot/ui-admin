<template>
  <v-list nav dense>
    <notification />

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

    <template v-if="$store.state.navbarMiniVariant && !$vuetify.breakpoint.mobile">
      <v-menu v-for="category of categories" :key="category + '2'" offset-x nudge-right="10" :rounded="false">
        <template #activator="{ on, attrs }">
          <v-tooltip right>
            <template #activator="{ on: on2, attrs: attrs2 }">
              <div v-bind="attrs2" style="position: relative;" v-on="on2">
                <v-icon class="miniIcon" v-bind="attrs" v-on="on">
                  {{ icons.get(category) }}
                </v-icon>
                <v-icon size="12" class="caretIcon">
                  mdi-menu-down
                </v-icon>
              </div>
            </template>
            <span>{{ translate('menu.' + category) }}</span>
          </v-tooltip>
        </template>
        <v-list color="#363636" class="pa-0" :rounded="false" flat>
          <v-list-item
            v-for="item of menu.filter(o => o.category === category)"
            :key="item.name"
            dense
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
        </v-list>
      </v-menu>
    </template>
    <template v-else>
      <v-list-group v-for="category of categories" :key="category" :value="false" :prepend-icon="icons.get(category)">
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
    </template>
  </v-list>
</template>

<script lang="ts">
import {
  defineAsyncComponent, defineComponent, onMounted, ref, useContext,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';

type menuType = { category?: string; name: string; id: string; this: any | null }[];
type menuWithEnabled = Omit<menuType[number], 'this'> & { enabled: boolean };

const icons = new Map<string, string>([
  ['dashboard', 'mdi-view-dashboard'],
  ['commands', 'mdi-exclamation-thick'],
  ['settings', 'mdi-cog'],
  ['manage', 'mdi-wrench'],
  ['stats', 'mdi-information-variant'],
  ['registry', 'mdi-format-list-bulleted-square'],
]);

export default defineComponent({
  components: { notification: defineAsyncComponent(() => import('./notification.vue')) },
  setup () {
    const context = useContext();
    const menu = ref([] as menuWithEnabled[]);

    onMounted(() => {
      getSocket('/core/general').emit('menu::private', (items) => {
        menu.value = items.sort((a: { name: string; }, b: { name: string; }) => {
          return translate('menu.' + a.name).localeCompare(translate('menu.' + b.name));
        })
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

<style scoped>
.miniIcon {
  width: 40px;
  height: 40px;
}

.miniIcon::after {
  border-radius: 4px;
  transform: scale(1);
}

.caretIcon {
  position: absolute;
  right: 0;
  bottom: 0;
}
</style>
