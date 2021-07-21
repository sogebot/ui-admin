<template>
  <v-container
    fluid
    :class="{ 'pa-4': !$vuetify.breakpoint.mobile }"
  >
    <v-data-table
      v-model="selected"
      show-expand
      :single-expand="true"
      :show-select="selectable"
      :expanded.sync="expanded"
      :loading="state.loading !== ButtonStates.success || state.saving"
      :headers="headers"
      :items-per-page="-1"
      hide-default-footer
      hide-default-header
      :items="items"
      @current-items="saveCurrentItems"
      @click:row="addToSelectedItem"
    >
      <template #top>
        <v-sheet
          flat
          color="dark"
          class="my-2 pb-2 mt-0"
        >
          <v-row class="px-2" no-gutters>
            <v-col cols="auto" align-self="center" class="pr-2">
              <v-btn icon :color="selectable ? 'primary' : 'secondary'" @click="selectable = !selectable">
                <v-icon>
                  {{ mdiCheckBoxMultipleOutline }}
                </v-icon>
              </v-btn>
            </v-col>
            <v-col cols="auto" align-self="center" class="ml-auto mt-2">
              <v-row no-gutters>
                <v-col>
                  <template v-if="selected.length > 0">
                    <v-dialog
                      v-model="deleteDialog"
                      max-width="500px"
                    >
                      <template #activator="{ on, attrs }">
                        <v-btn
                          color="error"
                          class="mr-1"
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
                            :headers="headers"
                            :items-per-page="-1"
                            hide-default-footer
                            hide-default-header
                            :items="selected"
                          >
                            <template #[`item.arrow`]="{ }">
                              <v-icon>{{ mdiChevronRight }}</v-icon>
                            </template>
                            <template #[`item.overlay`]="{ item }">
                              {{ item.value }}
                            </template>
                          </v-data-table>
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
                </v-col>
                <v-col align-self="end">
                  <v-btn
                    color="primary"
                    @click="addItem()"
                  >
                    Add item
                  </v-btn>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-sheet>
      </template>

      <template #[`item.id`]="{ item }">
        <code>{{ item.id }}</code>
      </template>

      <template #[`item.overlay`]="{ item }">
        <v-select
          v-model="item.value"
          :disabled="!!item.value"
          single-line
          :items="overlayOptions"
          @click.stop
        />
      </template>

      <template #[`item.arrow`]="{ }">
        <v-icon>{{ mdiChevronRight }}</v-icon>
      </template>

      <template #[`item.actions`]="{ item }">
        <div style="width: max-content;">
          <v-hover v-slot="{ hover }">
            <v-btn
              icon
              :color="hover ? 'primary' : 'secondary lighten-3'"
              :href="'/overlays/' + item.id"
            >
              <v-icon>{{ mdiLink }}</v-icon>
            </v-btn>
          </v-hover>
          <v-hover v-slot="{ hover }">
            <v-btn
              icon
              :color="hover ? 'primary' : 'secondary lighten-3'"
              :disabled="copied===item.id"
              @click.stop="copied=item.id"
            >
              <v-icon v-if="copied !== item.id">
                {{ mdiClipboard }}
              </v-icon>
              <v-icon v-else>
                {{ mdiClipboardCheck }}
              </v-icon>
            </v-btn>
          </v-hover>
        </div>
      </template>

      <template #expanded-item="{ headers, item }">
        <td
          :colspan="headers.length"
          class="pa-2"
        >
          <component
            :is="item.value"
            v-if="haveAnyOptions(item.value)"
            :key="item.id"
            :opts="item.opts"
            @update="item.opts = $event; triggerUpdate(items)"
          />
          <div v-else>
            No settings for <em>{{ item.value || 'this' }} overlay</em>
          </div>
        </td>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import {
  mdiCheckBoxMultipleOutline, mdiChevronRight, mdiClipboard, mdiClipboardCheck, mdiLink,
} from '@mdi/js';
import {
  defineComponent, onMounted, ref, useContext, watch,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import translate from '@sogebot/ui-helpers/translate';
import {
  cloneDeep, debounce, isEqual,
} from 'lodash';
import { v4 } from 'uuid';

import type { OverlayMappers } from '.bot/src/database/entity/overlay';
import { addToSelectedItem } from '~/functions/addToSelectedItem';
import api from '~/functions/api';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';

export default defineComponent({
  components: {
    alerts:          () => import('~/components/registry/overlays/alerts.vue'),
    emotes:          () => import('~/components/registry/overlays/emotes.vue'),
    emotesexplode:   () => import('~/components/registry/overlays/emotesexplode.vue'),
    emotesfireworks: () => import('~/components/registry/overlays/emotesfireworks.vue'),
    emotescombo:     () => import('~/components/registry/overlays/emotescombo.vue'),
    clipscarousel:   () => import('~/components/registry/overlays/clipscarousel.vue'),
    clips:           () => import('~/components/registry/overlays/clips.vue'),
    credits:         () => import('~/components/registry/overlays/credits.vue'),
    obswebsocket:    () => import('~/components/registry/overlays/obswebsocket.vue'),
    tts:             () => import('~/components/registry/overlays/tts.vue'),
    polls:           () => import('~/components/registry/overlays/polls.vue'),
    eventlist:       () => import('~/components/registry/overlays/eventlist.vue'),
  },
  setup () {
    const { $axios } = useContext();
    const items = ref([] as OverlayMappers[]);
    const cacheItems = ref([] as OverlayMappers[]);
    const overlayOptions = [
      { value: null, text: 'Please select an option' },
      { value: 'alerts', text: 'alerts' },
      { value: 'bets', text: 'bets' },
      { value: 'carousel', text: 'carousel' },
      { value: 'clips', text: 'clips' },
      { value: 'clipscarousel', text: 'clipscarousel' },
      { value: 'credits', text: 'credits' },
      { value: 'emotes', text: 'emotes' },
      { value: 'emotescombo', text: 'emotescombo' },
      { value: 'emotesfireworks', text: 'emotesfireworks' },
      { value: 'emotesexplode', text: 'emotesexplode' },
      { value: 'eventlist', text: 'eventlist' },
      { value: 'obswebsocket', text: 'obswebsocket' },
      { value: 'polls', text: 'polls' },
      { value: 'randomizer', text: 'randomizer' },
      { value: 'stats', text: 'stats' },
      { value: 'tts', text: 'tts' },
    ];

    const selected = ref([] as OverlayMappers[]);
    const copied = ref('');
    const expanded = ref([] as OverlayMappers[]);
    const currentItems = ref([] as OverlayMappers[]);
    const saveCurrentItems = (value: OverlayMappers[]) => {
      currentItems.value = value;
    };
    const deleteDialog = ref(false);
    const selectable = ref(false);

    watch(selectable, (val) => {
      if (!val) {
        selected.value = [];
      }
    });

    watch(copied, (val) => {
      if (val.length > 0) {
        EventBus.$emit('snack', 'success', 'Link copied to clipboard.');
        navigator.clipboard.writeText(`${document.location.protocol}//${document.location.host}/overlays/${val}`);
        setTimeout(() => {
          copied.value = '';
        }, 1000);
      }
    });

    const state = ref({ saving: false, loading: ButtonStates.progress } as {
      loading: number;
      saving: boolean;
    });

    const headers = [
      {
        value: 'id', text: '', sortable: false,
      },
      {
        value: 'arrow', text: '', sortable: false,
      },
      {
        value: 'overlay', text: '', sortable: false,
      },
      {
        value: 'actions', text: '', sortable: false,
      },
      { text: '', value: 'data-table-expand' },
    ];

    onMounted(() => {
      refresh();
    });

    const triggerUpdate = debounce(async (val) => {
      if (isEqual(cacheItems.value, val)) {
        return;
      }

      const promised: any[] = [];
      for (const item of val) {
        const cache = cacheItems.value.find(o => o.id === item.id);
        if (isEqual(cache, item)) {
          continue;
        }

        promised.push(
          new Promise((resolve, reject) => {
            api.patch($axios, `/api/v1/overlay/${item.id}`, item)
              .then(() => resolve(true))
              .catch((e) => {
                reject(e);
                error(e);
              });
          }),
        );
      }
      await Promise.all(promised);
      saveSuccess();
    }, 250);

    watch(items, triggerUpdate, { deep: true });

    const refresh = () => {
      api.get<OverlayMappers[]>($axios, `/api/v1/overlay/`)
        .then((response) => {
          items.value = cloneDeep(response.data.data);
          cacheItems.value = cloneDeep(response.data.data);
        })
        .then(() => (state.value.loading = ButtonStates.success));
    };

    const saveSuccess = () => {
      refresh();
      EventBus.$emit('snack', 'success', 'Data updated.');
      state.value.saving = false;
    };

    const deleteSelected = () => {
      deleteDialog.value = false;
      selected.value.forEach((item) => {
        api.delete($axios, `/api/v1/overlay/${item.id}`).catch(() => {
          return true;
        });
      });
      refresh();

      EventBus.$emit('snack', 'success', 'Data removed.');
      selected.value = [];
    };

    const addItem = () => {
      const item: OverlayMappers = {
        id:    v4(),
        value: null,
        opts:  null,
      };
      items.value.push(item);
      api.post<OverlayMappers>($axios, '/api/v1/overlay', item)
        .then(() => {
          EventBus.$emit('snack', 'success', 'Data created.');
        });
    };

    const haveAnyOptions = (type: string) => {
      const withOpts = ['eventlist', 'alerts', 'credits', 'clips', 'obswebsocket', 'clipscarousel', 'tts', 'polls', 'emotescombo', 'emotesfireworks', 'emotesexplode', 'emotes'];
      return withOpts.includes(type);
    };

    return {
      // refs
      items,
      expanded,
      state,
      headers,
      selected,
      deleteSelected,
      selectable,
      deleteDialog,
      translate,
      saveSuccess,
      overlayOptions,
      ButtonStates,
      copied,

      // functions
      addToSelectedItem: addToSelectedItem(selected, 'id', currentItems),
      addItem,
      haveAnyOptions,
      triggerUpdate,

      // icons
      mdiCheckBoxMultipleOutline,
      mdiChevronRight,
      mdiLink,
      mdiClipboard,
      mdiClipboardCheck,

      // external functions
      saveCurrentItems,
    };
  },
});
</script>
