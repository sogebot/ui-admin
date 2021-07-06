<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <v-alert
      v-if="!$store.state.$systems.find(o => o.name === 'highlights').enabled"
      color="error"
      class="mb-0"
    >
      {{ translate('this-system-is-disabled') }}
    </v-alert>

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
        <v-sheet
          flat
          color="dark"
          class="my-2 pb-2 mt-0"
        >
          <v-row class="px-2" no-gutters>
            <v-col align-self="center">
              <v-text-field
                v-model="search"
                :append-icon="mdiMagnify"
                label="Search"
                single-line
                hide-details
                class="pa-0 ma-2"
              />
            </v-col>
            <v-col cols="auto" align-self="center">
              <v-btn
                color="error"
                class="mr-1"
                @click="deleteExpired"
              >
                Delete Expired
              </v-btn>
            </v-col>
          </v-row>
        </v-sheet>
      </template>

      <template #[`item.thumbnail`]="{ item }">
        <v-img
          :aspect-ratio="16/9"
          :width="60"
          :src="generateThumbnail(item.game)"
        />
      </template>
      <template #[`item.actions`]="{ item }">
        <v-btn
          v-if="!item.expired"
          plain
          :href="'https://www.twitch.tv/videos/' + item.videoId + '?t=' + timestampToString(item.timestamp)"
          target="_blank"
        >
          <v-icon>{{ mdiLink }}</v-icon>
        </v-btn>
        <span
          v-else
          class="red--text text--lighten-1"
        >Expired</span>
      </template>
      <template #[`item.timestamp`]="{ item }">
        {{ timestampToString(item.timestamp) }}
      </template>
      <template #[`item.createdAt`]="{ item }">
        {{ dayjs(item.createdAt).format('LL') }} {{ dayjs(item.createdAt).format('LTS') }}
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">

import { mdiLink, mdiMagnify } from '@mdi/js';
import {
  computed, defineComponent, onMounted, ref,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { escapeRegExp, isNil } from 'lodash-es';

import type { HighlightInterface } from '.bot/src/bot/database/entity/highlight';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';

export default defineComponent({
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
      {
        text: 'Actions', value: 'actions', sortable: false, align: 'end',
      },
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
      getSocket('/systems/highlights').emit('generic::getAll', (err: string | null, _items: HighlightInterface[]) => {
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
            getSocket('/systems/highlights').emit('generic::deleteById', item.id, (err: string | null) => {
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
      mdiMagnify,
      mdiLink,
    };
  },
});
</script>
