<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <alert-disabled system="polls"/>

    <v-data-table
      v-model="selected"
      calculate-widths
      :show-select="selectable"
      :search="search"
      :loading="state.loading !== ButtonStates.success"
      :headers="headers"
      :items-per-page="-1"
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
                  mdi-checkbox-multiple-marked-outline
                </v-icon>
              </v-btn>
            </v-col>
            <v-col align-self="center">
              <v-text-field
                v-model="search"
                append-icon="mdi-magnify"
                label="Search"
                single-line
                hide-details
                class="pa-0 ma-2"
              />
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

              <v-dialog
                v-model="newDialog"
                max-width="500px"
              >
                <template #activator="{ on, attrs }">
                  <v-btn
                    color="primary"
                    v-bind="attrs"
                    v-on="on"
                  >
                    New item
                  </v-btn>
                </template>

                <v-card>
                  <v-card-title>
                    <span class="headline">New item</span>
                  </v-card-title>

                  <v-card-text :key="timestamp">
                    <new-item
                      :rules="rules"
                      @close="newDialog = false"
                      @save="saveSuccess"
                    />
                  </v-card-text>
                </v-card>
              </v-dialog>
            </v-col>
          </v-row>
        </v-sheet>
      </template>

      <template #[`item.totalVotes`]="{ item }">
        {{ totalVotes(item) }}
      </template>

      <template #[`item.votes`]="{ item }">
        <v-row
          v-for="(option, index) in item.options"
          :key="item.id + option + index + 'row'"
          no-gutters
          class="ma-0 pa-0 d-flex d-sm-none"
        >
          <v-col class="ma-1">
            {{ option }}
          </v-col>
          <v-col class="text-right ma-1">
            {{ getPercentage(item, index, 1) }}%
          </v-col>
        </v-row>
        <v-progress-linear
          v-for="(option, index) in item.options"
          :key="item.id + option + index"
          class="d-none d-sm-flex"
          height="20"
          :value="getPercentage(item, index, 1)"
        >
          <template #default="{ value }">
            <v-row class="ma-1">
              <v-col>
                {{ option }}
              </v-col>
              <v-col class="text-right">
                {{ value }}%
              </v-col>
            </v-row>
          </template>
        </v-progress-linear>
      </template>
      <template #[`item.type`]="{ item }">
        {{ translate('systems.polls.' + item.type) }}
      </template>

      <template #[`item.closedAt`]="{ item }">
        <span
          v-if="item.isOpened"
          class="green--text text--lighten-1"
        >{{ translate('systems.polls.activeFor') }} <strong>{{ dayjs().from(dayjs(activeTime(item)), true) }}</strong></span>
        <span
          v-else
          class="red--text text--lighten-1"
        >{{ translate('systems.polls.closedAt') }} <strong>{{ dayjs(item.closedAt).format('LLL') }}</strong></span>
      </template>

      <template #[`item.buttons`]="{ item }">
        <v-btn
          v-if="item.isOpened"
          icon
          @click="stop(item)"
        >
          <v-icon>mdi-stop</v-icon>
        </v-btn>
        <v-btn
          v-else
          :disabled="isRunning"
          icon
          @click="copy(item)"
        >
          <v-icon>mdi-content-copy</v-icon>
        </v-btn>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import {
  computed,
  defineAsyncComponent, defineComponent, onMounted, onUnmounted, ref, watch,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { cloneDeep } from 'lodash';
import { v4 as uuid } from 'uuid';

import type { PollInterface } from '@entity/poll';
import { addToSelectedItem } from '~/functions/addToSelectedItem';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { expectedValuesCount, required } from '~/functions/validators';

let interval: number;

export default defineComponent({
  components: {
    'new-item': defineAsyncComponent({
      loader: () => import('~/components/new-item/polls-newItem.vue'),
    }),
  },
  setup () {
    const rules = {
      title: [required], options: [expectedValuesCount(2)],
    };

    const items = ref([] as PollInterface[]);
    const isRunning = computed(() => {
      const running = items.value.find(o => typeof o !== 'string' && o.isOpened);
      return typeof running !== 'undefined';
    });
    const search = ref('');

    const selected = ref([] as PollInterface[]);
    const currentItems = ref([] as PollInterface[]);
    const saveCurrentItems = (value: PollInterface[]) => {
      currentItems.value = value;
    };
    const selectable = ref(false);
    watch(selectable, (val) => {
      if (!val) {
        selected.value = [];
      }
    });
    const deleteDialog = ref(false);
    const newDialog = ref(false);

    const timestamp = ref(Date.now());

    watch(newDialog, () => {
      timestamp.value = Date.now();
    });

    onMounted(() => {
      interval = window.setInterval(() => {
        refresh();
      }, 1000);
    });

    onUnmounted(() => {
      window.clearInterval(interval);
    });

    const state = ref({
      loading: ButtonStates.progress,
    } as {
      loading: number;
    });

    const headers = [
      {
        value: 'title', text: translate('systems.polls.title'),
      },
      {
        value: 'type', text: translate('systems.polls.votingBy'),
      },
      {
        value: 'votes', text: '', width: '20rem', sortable: false,
      },
      {
        value: 'totalVotes', text: translate('systems.polls.totalVotes'), align: 'align-center',
      },
      {
        value: 'closedAt', text: '',
      },
      {
        value: 'buttons', text: '', sortable: false,
      },
    ];

    const headersDelete = [
      {
        value: 'title', text: '',
      },
      {
        value: 'closedAt', text: '',
      },
    ];

    onMounted(() => {
      refresh();
    });

    const refresh = () => {
      getSocket('/systems/polls').emit('generic::getAll', (err, itemsGetAll: PollInterface[]) => {
        if (err) {
          return error(err);
        }
        console.debug('Loaded', itemsGetAll);
        items.value = itemsGetAll;
        // we also need to reset selection values
        if (selected.value.length > 0) {
          selected.value.forEach((selectedItem, index) => {
            selectedItem = items.value.find(o => o.id === selectedItem.id) || selectedItem;
            selected.value[index] = selectedItem;
          });
        }
        state.value.loading = ButtonStates.success;
      });
    };

    const saveSuccess = () => {
      refresh();
      EventBus.$emit('snack', 'success', 'Data updated.');
      newDialog.value = false;
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
            console.log('Updating', {
              itemToUpdate,
            }, {
              attr, value: item[attr],
            });
            getSocket('/systems/polls').emit('polls::save', {
              ...itemToUpdate,
              [attr]: item[attr], // save new value for all selected items
            }, () => {
              resolve(true);
            });
          });
        }),
      );
      refresh();
      EventBus.$emit('snack', 'success', 'Data updated.');
    };

    const deleteSelected = async () => {
      deleteDialog.value = false;
      await Promise.all(
        selected.value.map((item) => {
          return new Promise((resolve, reject) => {
            getSocket('/systems/polls').emit('generic::deleteById', item.id, (err) => {
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

    const totalVotes = (item: PollInterface) => {
      const votes = (item.votes ?? []).reduce((a, b) => b.votes + a, 0);
      return item.type === 'tips' ? Number(votes.toFixed(1)) : votes;
    };

    const activeTime = (item: PollInterface) => {
      return new Date(item.openedAt || Date.now()).getTime();
    };

    const getPercentage = (item: PollInterface, index: number, toFixed: number): string => {
      let numOfVotes = 0;
      if (item.votes) {
        for (let i = 0, length = item.votes.length; i < length; i++) {
          if (item.votes[i].option === index) {
            numOfVotes += item.votes[i].votes;
          }
        }
      }
      return Number((100 / totalVotes(item)) * numOfVotes || 0).toFixed(toFixed || 0);
    };
    const copy = (item: PollInterface) => {
      console.log('Copying', item);
      const clone = cloneDeep(item);
      clone.id = uuid();
      clone.votes = [];
      clone.isOpened = true;
      clone.openedAt = Date.now();
      getSocket('/systems/polls').emit('polls::save', clone, () => {
        refresh();
      });
      EventBus.$emit('snack', 'success', 'Data copied.');
    };
    const stop = (item: PollInterface) => {
      item.isOpened = false;
      item.closedAt = Date.now();
      getSocket('/systems/polls').emit('polls::close', item, (err) => {
        if (err) {
          console.error(err);
        }
      });
      EventBus.$emit('snack', 'success', 'Data updated.');
    };

    return {
      addToSelectedItem: addToSelectedItem(selected, 'id', currentItems),
      saveCurrentItems,
      items,
      search,
      state,
      headers,
      headersDelete,
      selected,
      selectable,
      deleteSelected,
      update,
      newDialog,
      deleteDialog,
      translate,
      saveSuccess,
      timestamp,
      rules,
      activeTime,
      totalVotes,
      dayjs,
      getPercentage,
      stop,
      copy,
      isRunning,
      ButtonStates,
    };
  },
});
</script>
