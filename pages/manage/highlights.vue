<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <alert-disabled system="highlights" />

    <v-data-table
      calculate-widths
      hide-default-header
      :loading="state.loading !== ButtonStates.success"
      :headers="headers"
      sort-by="createdAt"
      :sort-desc="true"
      :items-per-page="-1"
      :items="fItems"
    >
      <template #top>
        <table-search-bar :search.sync="search">
          <v-btn
            color="error"
            class="mr-1"
            @click="deleteExpired"
          >
            Delete Expired
          </v-btn>
        </table-search-bar>
      </template>

      <template #[`item`]="{ item }">
        <table-mobile :headers="headers" :item="item">
          <template #actions>
            <v-btn v-if="!item.expired" class="primary-hover" :href="'https://www.twitch.tv/videos/' + item.videoId + '?t=' + timestampToString(item.timestamp)" target="_blank" icon>
              <v-icon>
                mdi-link
              </v-icon>
            </v-btn>
            <span
              v-else
              class="red--text text--lighten-1"
            >Expired</span>
          </template>

          <template #thumbnail>
            <v-img
              :aspect-ratio="16/9"
              :width="100"
              :src="generateThumbnail(item.game)"
            />
          </template>
          <template #createdAt>
            {{ dayjs(item.createdAt).format('LL') }} {{ dayjs(item.createdAt).format('LTS') }}
          </template>
          <template #timestamp>
            {{ timestampToString(item.timestamp) }}
          </template>
        </table-mobile>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import type { HighlightInterface } from '@entity/highlight';
import {
  computed, defineAsyncComponent, defineComponent, onMounted, ref,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { escapeRegExp, isNil } from 'lodash';

import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';

export default defineComponent({
  components: { 'table-search-bar': defineAsyncComponent(() => import('~/components/table/searchBar.vue')) },
  setup () {
    const items = ref([] as HighlightInterface[]);
    const search = ref('');

    const fItems = computed(() => {
      if (search.value.length === 0) {
        return items.value;
      }
      return items.value.filter((o) => {
        const title = !isNil(o.title.match(new RegExp(escapeRegExp(search.value), 'ig')));
        const game = !isNil(o.game.match(new RegExp(escapeRegExp(search.value), 'ig')));
        return title || game;
      });
    });

    const state = ref({ loading: ButtonStates.progress } as {
      loading: number;
    });

    const headers = [
      {
        value: 'thumbnail', text: '', align: 'left',
      },
      { value: 'game', text: '' },
      { value: 'title', text: '' },
      { value: 'createdAt', text: '' },
      { value: 'timestamp', text: '' },
    ];

    const headersDelete = [
      { value: 'game', text: '' },
      { value: 'timestamp', text: '' },
      { value: 'createdAt', text: '' },
      { value: 'title', text: '' },
    ];

    onMounted(() => {
      refresh();
    });

    const refresh = () => {
      getSocket('/systems/highlights').emit('generic::getAll', (err, _items) => {
        if (err) {
          return error(err);
        }
        console.debug({ _items });
        items.value = _items;
        state.value.loading = ButtonStates.success;
      });
    };

    const timestampToString = (value: { hours: number; minutes: number; seconds: number }) => {
      const string = (value.hours ? `${value.hours}h` : '')
        + (value.minutes ? `${value.minutes}m` : '')
        + (value.seconds ? `${value.seconds}s` : '');
      return string;
    };

    const deleteExpired = async () => {
      await Promise.all(
        items.value.filter(o => o.expired).map((item) => {
          console.debug('Deleting', item);
          return new Promise((resolve, reject) => {
            if (!item.id) {
              reject(error('Missing item id'));
              return;
            }
            getSocket('/systems/highlights').emit('generic::deleteById', item.id, (err) => {
              if (err) {
                reject(error(err));
              }
              resolve(true);
            });
          });
        }),
      );
      refresh();

      EventBus.$emit('snack', 'success', 'Data removed.');
    };

    const generateThumbnail = (game: string) => {
      const template = 'https://static-cdn.jtvnw.net/ttv-boxart/./%{game}-60x80.jpg';
      return template.replace('%{game}', encodeURI(game));
    };

    return {
      items,
      fItems,
      headers,
      headersDelete,
      state,
      search,

      generateThumbnail,
      timestampToString,

      translate,
      ButtonStates,

      deleteExpired,

      dayjs,
    };
  },
});
</script>
