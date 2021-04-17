<template>
  <v-container
    fluid
    :class="{ 'pa-4': !$vuetify.breakpoint.mobile }"
  >
    <v-alert
      v-if="!$store.state.$integrations.find(o => o.name === 'spotify').enabled"
      dismissible
      prominent
      dense
    >
      <div class="text-caption">
        {{ translate('this-system-is-disabled') }}
      </div>
    </v-alert>

    <h2 v-if="!$vuetify.breakpoint.mobile">
      {{ translate('menu.spotify') }}
      {{ translate('menu.bannedsongs') }}
    </h2>

    <v-data-table
      v-model="selected"
      calculate-widths
      hide-default-header
      show-select
      :loading="state.loading !== ButtonStates.success"
      :headers="headers"
      item-key="spotifyUri"
      :items-per-page="-1"
      :items="fItems"
    >
      <template #top>
        <v-toolbar
          flat
        >
          <v-text-field
            v-model="search"
            :append-icon="mdiMagnify"
            label="Search or add by spotifyURI"
            single-line
            hide-details
            class="pr-2"
          />

          <template v-if="selected.length > 0">
            <v-dialog
              v-model="deleteDialog"
              max-width="500px"
            >
              <template #activator="{ on, attrs }">
                <v-btn
                  color="error"
                  class="mb-2 mr-1"
                  v-bind="attrs"
                  v-on="on"
                >
                  Delete {{ selected.length }} Item(s)
                </v-btn>
              </template>

              <v-card>
                <v-card-title>
                  <span class="headline">Delete {{ selected.length }} Item(s)?</span>
                </v-card-title>

                <v-card-text>
                  <v-data-table
                    dense
                    :items="selected"
                    :headers="headers"
                    hide-default-header
                    hide-default-footer
                  />
                </v-card-text>
                <v-card-actions>
                  <v-spacer />
                  <v-btn
                    text
                    @click="deleteDialog = false"
                  >
                    Cancel
                  </v-btn>
                  <v-btn
                    color="error"
                    text
                    @click="deleteSelected"
                  >
                    Delete
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </template>

          <v-btn
            color="primary"
            class="mb-2"
            :disabled="search.length === 0"
            :loading="state.import === 1"
            @click="addSong"
          >
            New Item
          </v-btn>
        </v-toolbar>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import { mdiMagnify } from '@mdi/js';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  computed, defineComponent, onMounted, ref,
} from '@vue/composition-api';
import { escapeRegExp, isNil } from 'lodash-es';

import type { SpotifySongBanInterface } from '.bot/src/bot/database/entity/spotify';
import { EventBus } from '~/functions/event-bus';

export default defineComponent({
  setup () {
    const items = ref([] as SpotifySongBanInterface[]);
    const search = ref('');

    const deleteDialog = ref(false);
    const selected = ref([] as SpotifySongBanInterface[]);

    const state = ref({
      loading: ButtonStates.progress,
      import:  ButtonStates.idle,
    } as {
      loading: number;
      import: number;
    });

    const headers = [
      { value: 'title', text: '' },
      { value: 'artists', text: '' },
    ];

    const fItems = computed(() => {
      if (search.value.length === 0) {
        return items.value;
      }
      return items.value.filter((o) => {
        const isSearchInTitle = !isNil(o.title.match(new RegExp(escapeRegExp(search.value), 'ig')));
        const inSpotifyUri = !isNil(o.spotifyUri.match(new RegExp(escapeRegExp(search.value), 'ig')));
        return isSearchInTitle || inSpotifyUri;
      });
    });

    onMounted(() => {
      refresh();
    });

    const refresh = () => {
      state.value.loading = ButtonStates.progress;
      getSocket('/integrations/spotify').emit('spotify::getAllBanned', {}, (_err: string | null, _items: SpotifySongBanInterface[]) => {
        items.value = _items;
        state.value.loading = ButtonStates.success;
      });
    };

    const addSong = () => {
      if (search.value === '') {
        EventBus.$emit('snack', 'red', 'Cannot add empty song to ban list.');
        return;
      }
      if (state.value.import === 0) {
        state.value.import = 1;
        getSocket('/integrations/spotify').emit('spotify::addBan', search.value, (err: string | null) => {
          if (err) {
            setTimeout(() => {
              search.value = '';
              state.value.import = 0;
            }, 1000);
            return;
          }
          state.value.import = 0;
          EventBus.$emit('snack', 'success', 'Song added to ban list.');
          refresh();
          search.value = '';
        });
      }
    };

    const deleteSelected = async () => {
      deleteDialog.value = false;
      await Promise.all(
        selected.value.map((item) => {
          return new Promise((resolve) => {
            getSocket('/integrations/spotify').emit('spotify::deleteBan', { spotifyUri: item.spotifyUri }, () => {
              resolve(true);
            });
          });
        }),
      );
      refresh();

      EventBus.$emit('snack', 'success', 'Data removed.');
      selected.value = [];
    };

    return {
      items,
      fItems,
      headers,
      state,
      search,

      addSong,

      translate,
      ButtonStates,

      deleteDialog,
      deleteSelected,
      selected,
      mdiMagnify,
    };
  },
});
</script>

<style>
tr:nth-of-type(odd) {
  background-color: rgba(0, 0, 0, 0.05);
}

.v-small-dialog__activator__content {
  word-break: break-word;
}
</style>