<template>
  <v-col
    cols="12"
    lg="12"
    md="12"
    sm="12"
    style="padding: 2px;"
  >
    <v-hover>
      <template #default="{ hover }">
        <v-card
          tile
          min-height="48"
          elevation="5"
          :loading="!isLoaded"
        >
          <v-row no-gutters>
            <v-col>
              <v-card-title :key="timestamp" class="px-1 py-0 text-truncate" style="font-size: 1rem;">
                <span v-html="game || capitalize(translate('not-available'))" />
              </v-card-title>
              <v-card-subtitle class="pa-1 pt-2 text-caption text-truncate">
                {{ capitalize(translate('game')) }}
              </v-card-subtitle>
            </v-col>
            <v-col>
              <v-card-title :key="timestamp" class="px-1 py-0 text-truncate" style="font-size: 1rem;">
                <span v-html="title || capitalize(translate('not-available'))" />
              </v-card-title>
              <v-card-subtitle class="pa-1 pt-2 text-caption text-truncate">
                {{ capitalize(translate('title')) }}
              </v-card-subtitle>
            </v-col>
            <v-col>
              <v-card-title :key="timestamp" class="px-1 py-0 text-truncate" style="font-size: 1rem;">
                <span v-if="tags.length === 0">{{ capitalize(translate('not-available')) }}</span>
                <small
                  v-for="tag of filterTags(true)"
                  :key="tag.name"
                  :class="{ 'grey--text': tag.is_auto }"
                >
                  {{ tag.name }}
                </small>
                <span
                  v-for="tag of filterTags(false)"
                  :key="tag.name"
                  :class="{ 'grey--text': tag.is_auto }"
                >
                  {{ tag.name }}
                </span>
              </v-card-title>
              <v-card-subtitle class="pa-1 pt-2 text-caption text-truncate">
                {{ capitalize(translate('tags')) }}
              </v-card-subtitle>
            </v-col>
          </v-row>

          <v-fade-transition>
            <v-overlay
              v-if="hover"
              absolute
              color="#333"
            >
              <v-btn x-small @click.stop="dialog = true">
                {{ translate('click-to-change') }}
              </v-btn>
            </v-overlay>
          </v-fade-transition>
        </v-card>
      </template>
    </v-hover>
    <change-game-dialog :dialog.sync="dialog" />
  </v-col>
</template>

<script lang="ts">
/* eslint-disable camelcase */
import {
  defineAsyncComponent,
  defineComponent, onMounted, ref, useStore,
} from '@nuxtjs/composition-api';
import { getTime } from '@sogebot/ui-helpers/getTime';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { capitalize, isNil } from 'lodash-es';

import { error } from '~/functions/error';

export default defineComponent({
  props:      { timestamp: Number },
  components: { changeGameDialog: defineAsyncComponent({ loader: () => import('./change-game-dialog.vue') }) },
  setup () {
    const dialog = ref(false);
    const game = ref(null as null | string);
    const title = ref(null as null | string);
    const cachedTitle = ref('');
    const tags = ref([] as { is_auto: boolean; localization_names: { [x:string]: string } }[]);
    const isLoaded = ref(false);
    const store = useStore<any>();

    const filterTags = (is_auto: boolean) => {
      return tags.value.filter(o => !!o.is_auto === is_auto).map((o) => {
        const key = Object.keys(o.localization_names).find(key2 => key2.includes(store.state.configuration.lang));
        return { name: o.localization_names[key || 'en-us'], is_auto: !!o.is_auto };
      }).sort((a, b) => {
        if ((a || { name: '' }).name < (b || { name: '' }).name) { // sort string ascending
          return -1;
        }
        if ((a || { name: '' }).name > (b || { name: '' }).name) {
          return 1;
        }
        return 0; // default return value (no sorting)
      });
    };

    const loadCustomVariableValue = (variable: string) => {
      return new Promise<string>((resolve) => {
        getSocket('/').emit('custom.variable.value', variable, (err: string | null, value: string) => {
          if (err) {
            error(err);
          }
          resolve(value);
        });
      });
    };

    const generateTitle = async (current: string, raw: string) => {
      if (raw.length === 0) {
        return current;
      }

      const variables = raw.match(/(\$_[a-zA-Z0-9_]+)/g);
      if (cachedTitle.value === current && isNil(variables)) {
        return cachedTitle.value;
      }

      if (!isNil(variables)) {
        for (const variable of variables) {
          const value = await loadCustomVariableValue(variable);
          raw = raw.replace(variable, `<strong style="border-bottom: 1px dotted gray" title="${variable}">${value}</strong>`);
        }
      }
      cachedTitle.value = raw;
      return raw;
    };

    onMounted(() => {
      getSocket('/').on('panel::stats', async (data: Record<string, any>) => {
        console.groupCollapsed('panel::stats::game');
        console.log(data.game);
        console.log(data.status);
        console.log(data.rawStatus);
        console.log(data.tags);
        console.groupEnd();
        game.value = data.game;
        title.value = await generateTitle(data.status, data.rawStatus);
        tags.value = data.tags;

        store.commit('setCurrentGame', game.value);
        store.commit('setCurrentTitle', data.rawStatus);
        store.commit('setCurrentTags', tags.value);

        isLoaded.value = true;
      });
    });
    return {
      getTime, translate, capitalize, game, title, tags, filterTags, isLoaded, dialog,
    };
  },
});
</script>
