<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <alert-disabled system="howlongtobeat" />

    <v-data-table
      v-model="selected"
      calculate-widths
      :show-select="selectable"
      :loading="state.loading !== ButtonStates.success"
      :headers="headers"
      sort-by="startedAt"
      :single-expand="true"
      show-expand
      :sort-desc="true"
      :items-per-page="-1"
      :items="fItems"
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
                  mdi-checkbox-multiple-marked-outline
                </v-icon>
              </v-btn>
            </v-col>
            <v-col align-self="center">
              <v-combobox
                v-model="gameToAdd"
                :search-input.sync="search"
                label="Search or add game"
                append-outside-icon="mdi-magnify"
                :items="searchForGameOpts"
                :return-object="false"
                class="pr-2 pt-5"
                :loading="state.search !== ButtonStates.idle && search.length > 0"
                clearable
              >
                <template #no-data>
                  <v-list-item>
                    <span class="subheading">Add new game</span>
                  </v-list-item>
                </template>
              </v-combobox>
            </v-col>

            <v-col cols="auto" align-self="center">
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
                        dense
                        :items="selected"
                        :headers="headersDelete"
                        :items-per-page="-1"
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
                class="mr-2"
                :disabled="gameToAdd === null || gameToAdd.length === 0"
                :loading="state.add === 1"
                @click="addGame"
              >
                New Item
              </v-btn>
            </v-col>
          </v-row>
        </v-sheet>
      </template>
      <template #[`item.main`]="{ item }">
        {{ timeToReadable(timestampToObject(getStreamsTimestamp(item, 'main') + +item.offset + getStreamsOffset(item, 'main'))) }} <span v-if="item.gameplayMain">/ {{ timeToReadable(timestampToObject(item.gameplayMain * 3600000)) }}</span>
      </template>
      <template #[`item.extra`]="{ item }">
        {{ timeToReadable(timestampToObject(getStreamsTimestamp(item, 'extra') + +item.offset + getStreamsOffset(item, 'extra'))) }} <span v-if="item.gameplayMain">/ {{ timeToReadable(timestampToObject(item.gameplayMainExtra * 3600000)) }}</span>
      </template>
      <template #[`item.completionist`]="{ item }">
        {{ timeToReadable(timestampToObject(getStreamsTimestamp(item, 'completionist') + +item.offset + getStreamsOffset(item, 'completionist'))) }} <span v-if="item.gameplayMain">/ {{ timeToReadable(timestampToObject(item.gameplayCompletionist * 3600000)) }}</span>
      </template>

      <template #[`item.offset`]="{ item }">
        <v-edit-dialog
          persistent
          large
          :return-value.sync="item.offset"
          @save="update(item, false, 'offset')"
        >
          {{ minutesFormatter(item.offset) }}
          <template #input>
            <timeInput v-model="item.offset" />
          </template>
        </v-edit-dialog>
      </template>

      <template #[`item.startedAt`]="{ item }">
        {{ dayjs(item.startedAt).format('LL') }} {{ dayjs(item.startedAt).format('LTS') }}
      </template>
      <template #[`item.thumbnail`]="{ item }">
        <v-img
          :aspect-ratio="16/9"
          :width="60"
          :src="`https://static-cdn.jtvnw.net/ttv-boxart/${encodeURIComponent(item.game)}-60x84.jpg`"
        />
      </template>

      <template #expanded-item="{ headers, item }">
        <td
          :colspan="headers.length"
          class="pa-2"
        >
          <v-container>
            <v-data-table
              dense
              :items="item.streams"
              :headers="headersOffset"
              :sort-desc="true"
              sort-by="createdAt"
              :items-per-page="10"
            >
              <template #[`item.createdAt`]="{ item }">
                {{ dayjs(item.createdAt).format('LL') }} {{ dayjs(item.createdAt).format('LTS') }}
              </template>
              <template #[`item.timestamp`]="{ item }">
                {{ timeToReadable(timestampToObject(item.timestamp)) }}
              </template>
              <template #[`item.offset`]="{ item }">
                <v-btn
                  x-small
                  :color="item.isMainCounted ? 'green' : 'dark'"
                  @click="item.isMainCounted = !item.isMainCounted"
                >
                  {{ translate('systems.howlongtobeat.main') }}
                </v-btn>
                <v-btn
                  x-small
                  :color="item.isExtraCounted ? 'green' : 'dark'"
                  @click="item.isExtraCounted = !item.isExtraCounted"
                >
                  {{ translate('systems.howlongtobeat.extra') }}
                </v-btn>
                <v-btn
                  x-small
                  :color="item.isCompletionistCounted ? 'green' : 'dark'"
                  @click="item.isCompletionistCounted = !item.isCompletionistCounted"
                >
                  {{ translate('systems.howlongtobeat.completionist') }}
                </v-btn>
              </template>
              <template #[`item.manual`]="{ item }">
                <v-row>
                  <v-col cols="auto">
                    <timeInput
                      :key="timestamp"
                      v-model="item.offset"
                    />
                  </v-col>
                  <v-col
                    cols="auto"
                    class="pt-7"
                  >
                    <v-btn
                      @click="item.offset = 0; timestamp = Date.now()"
                    >
                      <v-icon>mdi-refresh</v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
              </template>
            </v-data-table>
          </v-container>
        </td>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import { HowLongToBeatGame } from '@entity/howLongToBeatGame';
import {
  computed, defineAsyncComponent, defineComponent, onMounted, ref, watch,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import { getTime, timestampToObject } from '@sogebot/ui-helpers/getTime';
import translate from '@sogebot/ui-helpers/translate';
import axios from 'axios';
import { cloneDeep, debounce } from 'lodash';

import { addToSelectedItem } from '~/functions/addToSelectedItem';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { minValue, required } from '~/functions/validators';

export default defineComponent({
  components: { timeInput: defineAsyncComponent({ loader: () => import('~/components/time.vue') }) },
  setup () {
    const timestamp = ref(Date.now());
    const items = ref([] as Required<HowLongToBeatGame>[]);
    const searchForGameOpts = ref([] as string[]);
    const deleteDialog = ref(false);
    const selected = ref([] as Required<HowLongToBeatGame>[]);
    const currentItems = ref([] as Required<HowLongToBeatGame>[]);
    const saveCurrentItems = (value: Required<HowLongToBeatGame>[]) => {
      currentItems.value = value;
    };

    const selectable = ref(false);
    watch(selectable, (val) => {
      if (!val) {
        selected.value = [];
      }
    });

    const expanded = ref([] as HowLongToBeatGame['streams']);
    const gameToAdd = ref('');
    const state = ref({
      loading: ButtonStates.progress, add: ButtonStates.idle, search: ButtonStates.idle,
    } as {
      loading: number;
      add: number;
      search: number;
    });
    const search = ref('');

    const rules = { offset: [required, minValue(0)] };

    const getStreamsOffset = (item: HowLongToBeatGame, type: 'extra' | 'main' | 'completionist') => {
      return item.streams
        .filter(o => ((type === 'main' && o.isMainCounted) || (type === 'completionist' && o.isCompletionistCounted) || (type === 'extra' && o.isExtraCounted)))
        .reduce((a, b) => a + b.offset, 0);
    };

    const getStreamsTimestamp = (item: HowLongToBeatGame, type: 'extra' | 'main' | 'completionist') => {
      return item.streams
        .filter(o => ((type === 'main' && o.isMainCounted) || (type === 'completionist' && o.isCompletionistCounted) || (type === 'extra' && o.isExtraCounted)))
        .reduce((a, b) => a + b.timestamp, 0);
    };

    const fItems = computed(() => {
      return items.value
        .filter((o) => {
          if (search.value === null || search.value.trim() === '') {
            return true;
          }
          return o.game.trim().toLowerCase().includes(search.value.trim().toLowerCase());
        });
    });

    const headers = [
      { value: 'thumbnail', text: '' },
      {
        value: 'game', text: translate('systems.howlongtobeat.game'), sortable: true,
      },
      {
        value: 'startedAt', text: translate('systems.howlongtobeat.startedAt'), sortable: true,
      },
      {
        value: 'main', text: translate('systems.howlongtobeat.main'), sortable: false,
      },
      {
        value: 'extra', text: translate('systems.howlongtobeat.extra'), sortable: false,
      },
      {
        value: 'completionist', text: translate('systems.howlongtobeat.completionist'), sortable: false,
      },
      {
        value: 'offset', text: translate('systems.howlongtobeat.offset'), sortable: false,
      },
      {
        text: '', value: 'data-table-expand', sortable: false,
      },
    ];

    const headersDelete = [
      {
        value: 'game', text: translate('systems.howlongtobeat.game'), sortable: true,
      },
    ];

    const headersOffset = [
      {
        value: 'createdAt', text: translate('systems.howlongtobeat.when'), sortable: true,
      },
      {
        value: 'timestamp', text: translate('systems.howlongtobeat.time'), sortable: false,
      },
      {
        value: 'offset', text: '', sortable: false,
      },
      {
        value: 'manual', text: translate('systems.howlongtobeat.offset'), sortable: false,
      },
    ];

    onMounted(() => {
      refresh();
    });
    const refresh = () => {
      axios.get(`/api/systems/hltb`, { headers: { authorization: `Bearer ${localStorage.accessToken}` } })
        .then(({ data }) => {
          items.value = cloneDeep(data.data);
          console.debug('Loaded', { data });
          state.value.loading = ButtonStates.success;
        });
    };

    const timeToReadable = (data: { days: number; hours: number; minutes: number; seconds: number}) => {
      const output = [];
      if (data.days) {
        output.push(`${data.days}d`);
      }
      if (data.hours) {
        output.push(`${data.hours}h`);
      }
      if (data.minutes) {
        output.push(`${data.minutes}m`);
      }
      if (data.seconds || output.length === 0) {
        output.push(`${data.seconds}s`);
      }
      return output.join(' ');
    };
    const minutesFormatter = (value: number) => {
      return (value < 0 ? '- ' : '+ ') + timeToReadable(timestampToObject(Math.abs(value)));
    };

    const update = async (item: typeof items.value[number], multi = false, attr: keyof typeof items.value[number]) => {
      // check validity
      for (const key of Object.keys(rules)) {
        for (const rule of (rules as any)[key]) {
          const ruleStatus = rule((item as any)[key]);
          if (ruleStatus === true) {
            continue;
          } else {
            EventBus.$emit('snack', 'red', `[${key}] - ${ruleStatus}`);
            refresh();
            return;
          }
        }
      }

      // update all instantly
      for (const i of [item, ...(multi ? selected.value : [])]) {
        (i as any)[attr] = item[attr];
      }

      await Promise.all(
        [item, ...(multi ? selected.value : [])].map((itemToUpdate) => {
          return new Promise((resolve) => {
            console.log('Updating', { itemToUpdate }, { attr, value: item[attr] });
            axios.post(`/api/systems/hltb/${itemToUpdate.id}`, itemToUpdate, { headers: { authorization: `Bearer ${localStorage.accessToken}` } })
              .then(() => {
                resolve(true);
              });
          });
        }),
      );
      refresh();
      EventBus.$emit('snack', 'success', 'Data updated.');
    };

    watch(items, () => {
      for (const item of items.value) {
        axios.post(`/api/systems/hltb/${item.id}`, item, { headers: { authorization: `Bearer ${localStorage.accessToken}` } });
      }
    }, { deep: true });

    watch(search, debounce((value: string | null) => {
      if (value && value.trim().length !== 0) {
        state.value.search = ButtonStates.progress;
        axios.post(`/api/systems/hltb?search=${value}`, undefined, { headers: { authorization: `Bearer ${localStorage.accessToken}` } })
          .then(({ data }) => {
            searchForGameOpts.value = data.data;
            state.value.search = ButtonStates.idle;
          })
          .catch(() => {
            state.value.search = ButtonStates.idle;
          });
      } else {
        searchForGameOpts.value = [];
      }
    }, 500));

    const addGame = () => {
      if (gameToAdd.value === '' || gameToAdd.value === null) {
        EventBus.$emit('snack', 'red', 'Cannot add empty game.');
        return;
      }
      if (state.value.add === 0) {
        state.value.add = 1;
        axios.post(`/api/systems/hltb`, gameToAdd.value, { headers: { authorization: `Bearer ${localStorage.accessToken}` } })
          .then(() => {
            state.value.add = 0;
            refresh();
            gameToAdd.value = '';
            EventBus.$emit('snack', 'success', 'Game added to list.');
          });
      }
    };

    const deleteSelected = async () => {
      deleteDialog.value = false;
      await Promise.all(
        selected.value.map((item) => {
          return new Promise((resolve, reject) => {
            if (!item.id) {
              reject(error('Missing item id'));
              return;
            }
            axios.delete(`/api/systems/hltb/${item.id}`, { headers: { authorization: `Bearer ${localStorage.accessToken}` } })
              .then(resolve)
              .catch(resolve);
          });
        }),
      );
      refresh();

      EventBus.$emit('snack', 'success', 'Data removed.');
      selected.value = [];
    };

    return {
      addToSelectedItem: addToSelectedItem(selected, 'id', currentItems),
      saveCurrentItems,
      items,
      headers,
      expanded,
      state,
      search,
      fItems,
      getTime,
      getStreamsTimestamp,
      getStreamsOffset,
      timeToReadable,
      timestampToObject,
      minutesFormatter,
      searchForGameOpts,
      translate,
      gameToAdd,

      deleteDialog,
      deleteSelected,
      selected,
      selectable,
      addGame,
      headersDelete,
      rules,
      update,
      headersOffset,
      timestamp,
      dayjs,

      ButtonStates,
    };
  },
});
</script>
