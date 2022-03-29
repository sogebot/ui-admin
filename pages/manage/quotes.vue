<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <alert-disabled system="quotes" />

    <v-expand-transition>
      <v-app-bar v-if="selected.length > 0" color="blue-grey darken-4" fixed dense>
        <v-row class="px-2" dense justify="end">
          <v-col cols="auto" align-self="center">
            {{ selected.length }} items selected
          </v-col>

          <v-col cols="auto" align-self="center">
            <v-row dense>
              <v-col v-if="selected.length > 0" cols="auto">
                <v-dialog v-model="deleteDialog" max-width="500px">
                  <template #activator="{ on, attrs }">
                    <v-btn class="error" small v-bind="attrs" v-on="on">
                      <v-icon left>
                        mdi-delete-forever
                      </v-icon>
                      Delete
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
                      <v-btn text @click="deleteDialog = false">
                        Cancel
                      </v-btn>
                      <v-btn color="error" text @click="deleteSelected">
                        Delete
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-app-bar>
    </v-expand-transition>

    <v-data-table
      v-model="selected"
      show-select
      calculate-widths
      :search="search"
      :loading="state.loading === 1"
      :headers="headers"
      :items-per-page="-1"
      :items="fItems"
      @current-items="saveCurrentItems"
    >
      <template #top>
        <search-bar :search.sync="search">
          <quotes-edit
            :rules="rules"
            :tags="tags"
            @save="refresh()"
          />
        </search-bar>
      </template>

      <template #[`body.prepend`]="{}">
        <tr>
          <td v-if="!$vuetify.breakpoint.mobile" colspan="3" />
          <td :class="{'v-data-table__mobile-row': $vuetify.breakpoint.mobile}">
            <v-select v-model="showTag" :items="tagsItems" clearable />
          </td>
          <td v-if="!$vuetify.breakpoint.mobile" colspan="2" />
        </tr>
      </template>

      <template #[`item`]="{ item }">
        <table-mobile :headers="headers" :selected="selected" :item="item" :add-to-selected-item="addToSelectedItem">
          <template #actions>
            <quotes-edit
              :rules="rules"
              :tags="tags"
              :value="item"
              @save="refresh()"
            />
            <v-btn class="danger-hover" icon @click="selected = [item]; deleteDialog = true;">
              <v-icon>
                mdi-delete-forever
              </v-icon>
            </v-btn>
          </template>

          <template #id>
            {{ item.id }}
            <div class="grey--text">
              {{ dayjs(item.createdAt).format('LL') }} {{ dayjs(item.createdAt).format('LTS') }}
            </div>
          </template>
          <template #quotedByName>
            <NuxtLink :to="'/manage/viewers/' + item.quotedBy">
              {{ item.quotedByName }}&nbsp;<small>{{ item.quotedBy }}</small>
            </NuxtLink>
          </template>
          <template #tags>
            <v-chip-group class="d-inline-block">
              <v-chip
                v-for="tag of item.tags"
                :key="tag"
                :color="showTag === tag ? 'primary' : 'secondary'"
                label
                class="mr-2"
                @click="showTag=tag"
              >
                {{ tag }}
              </v-chip>
            </v-chip-group>
          </template>
        </table-mobile>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import type { QuotesInterface } from '@entity/quotes';
import {
  computed, defineAsyncComponent, defineComponent, onMounted, ref, watch,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  capitalize, flatten, orderBy, uniq,
} from 'lodash';

import { addToSelectedItem } from '~/functions/addToSelectedItem';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { required } from '~/functions/validators';

export default defineComponent({
  components: {
    'search-bar':   defineAsyncComponent(() => import('~/components/table/searchBar.vue')),
    'table-mobile': defineAsyncComponent(() => import('~/components/table/tableMobile.vue')),
    'quotes-edit':  defineAsyncComponent(() => import('~/components/manage/quotes/quotesEdit.vue')),
  },
  setup () {
    const selected = ref([] as QuotesInterface[]);
    const currentItems = ref([] as QuotesInterface[]);
    const saveCurrentItems = (value: QuotesInterface[]) => {
      currentItems.value = value;
    };
    const deleteDialog = ref(false);

    const rules = { quote: [required] };

    const items = ref([] as QuotesInterface[]);
    const search = ref('');
    const showTag = ref(null as null | string);

    const headers = [
      {
        value: 'id', text: '#', sortable: true,
      },
      {
        value: 'quote', text: translate('systems.quotes.quote.name'), sortable: true,
      },
      {
        value: 'tags', text: translate('systems.quotes.tags.name'), sortable: false,
      },
      {
        value: 'quotedByName', text: translate('systems.quotes.by.name'), sortable: true,
      },
      { value: 'actions', sortable: false },
    ];

    const headersDelete = [
      {
        value: 'quote', text: translate('systems.quotes.quote.name'), sortable: true,
      },
      {
        value: 'quotedByName', text: translate('systems.quotes.by.name'), sortable: true,
      },
    ];

    const state = ref({ loading: ButtonStates.progress } as {
      loading: number,
    });

    onMounted(() => {
      refresh();
    });

    const refresh = () => {
      getSocket('/systems/quotes').emit('quotes:getAll', {}, (err, data) => {
        if (err) {
          error(err);
          return;
        }
        items.value = data;
        state.value.loading = ButtonStates.success;
      });
    };

    const fItems = computed(() => {
      let quotesFilteredBySearch: QuotesInterface[] = [];
      if (search.value.trim().length > 0) {
        for (const quote of items.value) {
          if (quote.quote.toLowerCase().includes(search.value)) {
            quotesFilteredBySearch.push(quote);
          }
        }
      } else {
        quotesFilteredBySearch = items.value;
      }
      if (showTag.value === null) {
        return quotesFilteredBySearch;
      } else {
        const quotesFilteredByTags: QuotesInterface[] = [];
        for (const quote of quotesFilteredBySearch) {
          for (const tag of quote.tags) {
            if (showTag.value === tag) {
              quotesFilteredByTags.push(quote);
              break;
            }
          }
        }
        return quotesFilteredByTags;
      }
    });

    const tags = computed(() => {
      const _tags: string[][] = [];
      for (const quote of items.value) {
        _tags.push(quote.tags);
      }
      return orderBy(uniq(flatten(_tags)));
    });
    const tagsItems = computed(() => {
      return [{ text: 'Not filtered', value: null }, ...tags.value.map(item => ({
        text:     item,
        value:    item,
        disabled: false,
      }))];
    });

    const deleteSelected = async () => {
      deleteDialog.value = false;
      await Promise.all(
        selected.value.map((item) => {
          return new Promise((resolve, reject) => {
            if (!item.id) {
              reject(error('Missing item id'));
              return;
            }
            getSocket('/systems/quotes').emit('generic::deleteById', item.id, (err) => {
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
      selected.value = [];
    };

    return {
      addToSelectedItem: addToSelectedItem(selected, 'id', currentItems),
      saveCurrentItems,
      items,
      fItems,
      tags,
      tagsItems,
      headers,
      headersDelete,
      state,
      search,
      showTag,
      capitalize,

      deleteDialog,
      deleteSelected,
      selected,
      rules,

      dayjs,
      translate,
      ButtonStates,
      refresh,
    };
  },
});
</script>
