<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <v-data-table v-model="selected" :expanded.sync="expanded" :show-select="selectable"
      :loading="state.loading !== ButtonStates.success" :headers="headers" :items-per-page.sync="perPage"
      :sort-by.sync="sortBy" :sort-desc.sync="sortDesc" :items="fItems" item-key="userId" :page.sync="currentPage"
      :server-items-length.sync="count" show-expand :single-expand="true" @current-items="saveCurrentItems"
      @click:row="addToSelectedItem">
      <template #top>
        <v-sheet flat color="dark" class="my-2 pb-2 mt-0">
          <v-row class="px-2" no-gutters>
            <v-col cols="auto" align-self="center" class="pr-2">
              <v-btn icon :color="selectable ? 'primary' : 'secondary'" @click="selectable = !selectable">
                <v-icon>
                  mdi-checkbox-multiple-marked-outline
                </v-icon>
              </v-btn>

              <v-menu absolute offset-y style="max-width: 600px">
                <template v-slot:activator="{ on, attrs }">
                  <v-btn color="dark" v-bind="attrs" v-on="on">
                    {{ translate('commons.reset') }}
                  </v-btn>
                </template>

                <v-list>
                  <v-list-item @click="resetPoints">
                    <v-list-item-title>{{ translate('points') }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="resetWatchedTime">
                    <v-list-item-title>{{ translate('watched-time') }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="resetMessages">
                    <v-list-item-title>{{ translate('messages') }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="resetBits">
                    <v-list-item-title>{{ translate('bits') }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="resetTips">
                    <v-list-item-title>{{ translate('tips') }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="resetSubgifts">
                    <v-list-item-title>{{ translate('subgifts') }}</v-list-item-title>
                  </v-list-item>
                </v-list>

              </v-menu>
            </v-col>
            <v-col align-self="center">
              <v-text-field v-model="search" append-icon="mdi-magnify" label="Search" single-line hide-details
                class="pa-0 ma-2" />
            </v-col>
            <v-col cols="auto" align-self="center">
              <filter-button :value="filter.followers" @save="value=>filter.followers=value">
                followers
              </filter-button>
              <filter-button :value="filter.subscribers" @save="value=>filter.subscribers=value">
                subscribers
              </filter-button>
              <filter-button :value="filter.vips" @save="value=>filter.vips=value">
                vips
              </filter-button>
              <filter-button :value="filter.active" @save="value=>filter.active=value">
                active
              </filter-button>

              <template v-if="selected.length > 0">
                <v-dialog v-model="deleteDialog" max-width="500px">
                  <template #activator="{ on, attrs }">
                    <v-btn color="error" class="mr-1" v-bind="attrs" v-on="on">
                      Delete {{ selected.length }} Item(s)
                    </v-btn>
                  </template>

                  <v-card>
                    <v-card-title>
                      <span class="headline">Delete {{ selected.length }} Item(s)?</span>
                    </v-card-title>

                    <v-card-text>
                      <v-data-table dense :items="selected" :headers="headersDelete" :items-per-page="-1"
                        hide-default-header hide-default-footer />
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
              </template>
            </v-col>
          </v-row>
        </v-sheet>
      </template>

      <template #[`item.userName`]="{ item }">
        {{ item.userName }}<small class="grey--text pl-2">{{ item.userId }}</small>
        <div>
          <v-chip x-small :color="item.isOnline ? 'success' : 'error'">
            Active
          </v-chip>
          <v-chip x-small :color="item.isVIP ? 'success' : 'error'">
            VIP
          </v-chip>
          <div class="d-inline-flex">
            <followers-chip :key="item.userId + 'follow' + timestamp" :item="item"
              @save="item.isFollower = $event.isFollower; item.haveFollowerLock = $event.haveFollowerLock; update(item, true, 'isFollower')"
              @close="timestamp = Date.now()" />
          </div>
          <div class="d-inline-flex">
            <subscribers-chip :key="item.userId + 'sub' + timestamp" :item="item"
              @save="item.isSubscriber = $event.isSubscriber; item.haveSubscriberLock = $event.haveSubscriberLock; update(item, true, 'isSubscriber')"
              @close="timestamp = Date.now()" />
          </div>
        </div>
      </template>

      <template #[`item.messages`]="{ item }">
        <v-edit-dialog persistent large :return-value.sync="item.messages" @save="update(item, true, 'messages')">
          {{ item.messages }}
          <template #input>
            <v-text-field v-model.number="item.messages" type="number" min="0" :rules="rules.messages" single-line />
          </template>
        </v-edit-dialog>
      </template>

      <template #[`item.points`]="{ item }">
        <v-edit-dialog persistent large :return-value.sync="item.points" @save="update(item, true, 'points')">
          {{ item.points }}
          <template #input>
            <v-text-field v-model.number="item.points" type="number" min="0" :rules="rules.points" single-line />
          </template>
        </v-edit-dialog>
      </template>

      <template #[`item.sumTips`]="{ item }">
        <tips :sum="item.sumTips" :user-id="item.userId"
          @save="value=>{ item.tips = value; update(item, false, 'tips'); }" />
      </template>

      <template #[`item.sumBits`]="{ item }">
        <bits :sum="item.sumBits" :user-id="item.userId"
          @save="value=>{ item.bits = value; update(item, false, 'bits'); }" />
      </template>

      <template #[`item.subscribeCumulativeMonths`]="{ item }">
        <v-edit-dialog persistent large :return-value.sync="item.subscribeCumulativeMonths"
          @save="update(item, true, 'subscribeCumulativeMonths')">
          {{ item.subscribeCumulativeMonths }}
          <template #input>
            <v-text-field v-model="item.subscribeCumulativeMonths" type="number" min="0"
              :rules="rules.subscribeCumulativeMonths" single-line />
          </template>
        </v-edit-dialog>
      </template>

      <template #[`item.subscribeStreak`]="{ item }">
        <v-edit-dialog persistent large :return-value.sync="item.subscribeStreak"
          @save="update(item, true, 'subscribeStreak')">
          {{ item.subscribeStreak }}
          <template #input>
            <v-text-field v-model="item.subscribeStreak" type="number" min="0" :rules="rules.subscribeStreak"
              single-line />
          </template>
        </v-edit-dialog>
      </template>

      <template #[`item.giftedSubscribes`]="{ item }">
        <v-edit-dialog persistent large :return-value.sync="item.giftedSubscribes"
          @save="update(item, true, 'giftedSubscribes')">
          {{ item.giftedSubscribes }}
          <template #input>
            <v-text-field v-model="item.giftedSubscribes" type="number" min="0" :rules="rules.giftedSubscribes"
              single-line />
          </template>
        </v-edit-dialog>
      </template>

      <template #[`item.watchedTime`]="{ item }">
        <v-edit-dialog persistent large :return-value.sync="item.watchedTime" @save="update(item, true, 'watchedTime')">
          {{ Intl.NumberFormat($store.state.configuration.lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.watchedTime / 1000 / 60 / 60) }}h
          <template #input>
            <v-text-field :value="watchedTimeFormat(item.watchedTime)" type="number" min="0" step="0.5"
              :rules="rules.watchedTime" single-line suffix="h" @blur="setWatchedTime(item, $event.target._value)" />
          </template>
        </v-edit-dialog>
      </template>

      <template #[`item.seenAt`]="{ item }">
        <div class="dividerEdit">
          <v-edit-dialog persistent large :return-value.sync="item.seenAt" @save="update(item, true, 'seenAt')">
            <template v-if="item.seenAt">
              {{ dayjs(item.seenAt).format('LL') }} {{ dayjs(item.seenAt).format('LTS') }}
            </template>
            <v-divider v-else class="px-4" />

            <template #input>
              <v-text-field
                type="datetime-local"  step="1"
                clearable
                :value="item.seenAt ? dayjs(item.seenAt).format('YYYY-MM-DDTHH:mm') : null"
                @input="item.seenAt = $event ? dayjs($event).toISOString() : null"
              />
            </template>
          </v-edit-dialog>
        </div>
      </template>

      <template #[`item.followedAt`]="{ item }">
        <div class="dividerEdit">
          <v-edit-dialog persistent large :return-value.sync="item.followedAt"
            @open="lockBackup = item.haveFollowedAtLock" @close="item.haveFollowedAtLock = lockBackup"
            @save="update(item, true, 'followedAt')">
            <template v-if="item.followedAt">
              <v-icon v-if="item.haveFollowedAtLock" x-small>
                mdi-lock
              </v-icon>
              {{ dayjs(String(item.followedAt)).format('LL') }} {{ dayjs(String(item.followedAt)).format('LTS') }}
            </template>
            <v-divider v-else class="px-4" />

            <template #input>
              <v-text-field
                type="datetime-local"  step="1"
                clearable
                :value="item.followedAt ? dayjs(item.followedAt).format('YYYY-MM-DDTHH:mm') : null"
                @input="item.followedAt = $event ? dayjs($event).toISOString() : null"
                >
                <template #prepend>
                  <v-btn
                    :color="item.haveFollowedAtLock ? 'success' : 'error'" icon
                    @click="item.haveFollowedAtLock = !item.haveFollowedAtLock">
                    <v-icon>{{ item.haveFollowedAtLock ? 'mdi-lock' : 'mdi-lock-off' }}</v-icon>
                  </v-btn>
                  <v-btn icon :disabled="state.forceCheckFollowedAt !== ButtonStates.idle" @click="forceCheckFollowedAt(item)">
                    <v-progress-circular v-if="state.forceCheckFollowedAt !== ButtonStates.idle" indeterminate />
                    <v-icon v-else>
                      mdi-refresh
                    </v-icon>
                  </v-btn>
                </template>
              </v-text-field>
            </template>
          </v-edit-dialog>
        </div>
      </template>

      <template #[`item.subscribedAt`]="{ item }">
        <div class="dividerEdit">
          <v-edit-dialog persistent large :return-value.sync="item.subscribedAt"
            @open="lockBackup = item.haveSubscribedAtLock" @close="item.haveSubscribedAtLock = lockBackup"
            @save="update(item, true, 'subscribedAt')">
            <template v-if="item.subscribedAt">
              <v-icon v-if="item.haveSubscribedAtLock" x-small>
                mdi-lock
              </v-icon>
              {{ dayjs(item.subscribedAt).format('LL') }} {{ dayjs(item.subscribedAt).format('LTS') }}
            </template>
            <v-divider v-else class="px-4" />

            <template #input>
              <v-text-field
                type="datetime-local"  step="1"
                clearable
                :value="item.subscribedAt ? dayjs(item.subscribedAt).format('YYYY-MM-DDTHH:mm') : null"
                @input="item.subscribedAt = $event ? dayjs($event).toISOString() : null"
                >
                <template #prepend>
                  <v-btn
                    :color="item.havesubscribedAtLock ? 'success' : 'error'" icon
                    @click="item.havesubscribedAtLock = !item.havesubscribedAtLock">
                    <v-icon>{{ item.havesubscribedAtLock ? 'mdi-lock' : 'mdi-lock-off' }}</v-icon>
                  </v-btn>
                </template>
              </v-text-field>
            </template>
          </v-edit-dialog>
        </div>
      </template>

      <template #expanded-item="{ headers, item: parentItem }">
        <td :colspan="headers.length" class="pa-2">
          <v-container>
            <v-data-table dense :items="history" :loading="state.history !== ButtonStates.success" hide-default-header
              :headers="headersHistory" :sort-desc="true" sort-by="timestamp" :items-per-page="10">
              <template #top>
                <h3>History</h3>
              </template>
              <template #[`item.timestamp`]="{ item }">
                {{ dayjs(item.timestamp).format('LL') }} {{ dayjs(item.timestamp).format('LTS') }}
              </template>
              <template #[`item.info`]="{ item }">
                <template v-if="item.event === 'raid' || item.event === 'host'">
                  {{ translate('managers.viewers.hostAndRaidViewersCount').replace('$value', JSON.parse(item.values_json).viewers) }}
                </template>
                <template v-else-if="item.event === 'subcommunitygift'">
                  <strong>{{ item.event }} - {{ JSON.parse(item.values_json).count }}</strong>
                </template>
                <template v-else-if="item.event === 'subgift'">
                  <div v-if="item.userName === parentItem.userName"
                    v-html="translate('managers.viewers.receivedSubscribeFrom').replace('$value', JSON.parse(item.values_json).fromId)" />
                  <div v-else
                    v-html="translate('managers.viewers.giftedSubscribeTo').replace('$value', item.userName)" />
                </template>
              </template>
            </v-data-table>
          </v-container>
        </td>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import {
  computed,
  defineAsyncComponent,
  defineComponent, onMounted, ref, useRoute,
  watch,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { capitalize, orderBy } from 'lodash';

import type { EventListInterface } from '.bot/src/database/entity/eventList';
import type { UserInterface } from '.bot/src/database/entity/user';
import { addToSelectedItem } from '~/functions/addToSelectedItem';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { minValue, required } from '~/functions/validators';

const timeToDate = (value: null | string) => {
  return new Date(value || 0).toISOString().substr(0, 10);
};
const timeToTime = (value: null | string) => {
  return dayjs(value).format('HH:mm:ss');
};

export default defineComponent({
  filters: {
    timeToDate,
    timeToTime,
  },
  components: {
    followersChip: defineAsyncComponent({
      loader: () => import('~/components/viewers/followersChip.vue'),
    }),
    subscribersChip: defineAsyncComponent({
      loader: () => import('~/components/viewers/subscribersChip.vue'),
    }),
    tips: defineAsyncComponent({
      loader: () => import('~/components/viewers/tips.vue'),
    }),
    bits: defineAsyncComponent({
      loader: () => import('~/components/viewers/bits.vue'),
    }),
    FilterButton: defineAsyncComponent({
      loader: () => import('~/components/viewers/filterButton.vue'),
    }),
  },
  setup () {
    const rules = {
      messages:                  [minValue(0), required],
      points:                    [minValue(0), required],
      watchedTime:               [minValue(0), required],
      giftedSubscribes:          [minValue(0), required],
      subscribeCumulativeMonths: [minValue(0), required],
      subscribeStreak:           [minValue(0), required],
    };

    const search = ref(useRoute().value.params.id ? useRoute().value.params.id : '');
    const history = ref([] as EventListInterface[]);
    const items = ref([] as UserInterface[]);
    const selected = ref([] as UserInterface[]);
    const currentItems = ref([] as UserInterface[]);
    const saveCurrentItems = (value: UserInterface[]) => {
      currentItems.value = value;
    };
    const selectable = ref(false);
    watch(selectable, (val) => {
      if (!val) {
        selected.value = [];
      }
    });
    const expanded = ref([] as UserInterface[]);
    const lockBackup = ref(false);
    const deleteDialog = ref(false);

    const timestamp = ref(new Date().toISOString());
    const state = ref({
      history:              ButtonStates.idle,
      forceCheckFollowedAt: ButtonStates.idle,
      loading:              ButtonStates.progress,
    } as {
      history: number;
      forceCheckFollowedAt: number;
      loading: number;
    });

    const currentPage = ref(1);
    const count = ref(0);
    const perPage = ref(15);
    const sortBy = ref('userName');
    const sortDesc = ref(false);

    watch(expanded, (expandedItems) => {
      if (expandedItems.length > 0) {
        state.value.history = ButtonStates.progress;
        getSocket('/overlays/eventlist').emit('eventlist::getUserEvents', expandedItems[0].userId, (err: string | null, events: Required<EventListInterface>[]) => {
          if (err) {
            return console.error(err);
          }
          history.value = events;
          state.value.history = ButtonStates.success;
        });
      }
    }, {
      deep: true,
    });

    watch([sortBy, sortDesc], () => {
      if (!sortBy.value) {
        sortBy.value = 'userName';
      }

      if (typeof sortDesc.value === 'undefined') {
        sortDesc.value = false;
      }
    });

    const filter = ref({
      followers:   null,
      subscribers: null,
      vips:        null,
      active:      null,
    });

    const fItems = computed(() => {
      if (search.value === '') {
        return items.value;
      } else {
        return items.value.filter((item) => {
          const userId = item.userId.toLowerCase().includes(search.value.toLowerCase());
          const userName = item.userName.toLowerCase().includes(search.value.toLowerCase());
          return userId || userName;
        });
      }
    });

    watch([currentPage, sortBy, sortDesc, filter, search, perPage], () => {
      refresh();
    }, {
      deep: true,
    });

    const headersDelete = [
      {
        value: 'userId', text: '',
      },
      {
        value: 'userName', text: '',
      },
    ];

    const headersHistory = [
      {
        value: 'timestamp', text: '',
      },
      {
        value: 'event', text: '',
      },
      {
        value: 'info', text: '',
      },
    ];

    const headers = [
      {
        value: 'userName', text: capitalize(translate('username')),
      },
      {
        value: 'messages', text: capitalize(translate('messages')),
      },
      {
        value: 'level', text: capitalize(translate('level')),
      },
      {
        value: 'points', text: capitalize(translate('points')),
      },
      {
        value: 'watchedTime', text: capitalize(translate('watched-time')),
      },
      {
        value: 'seenAt', text: capitalize(translate('last-seen')),
      },
      {
        value: 'followedAt', text: capitalize(translate('followed-since')),
      },
      {
        value: 'subscribedAt', text: capitalize(translate('subscribed-since')),
      },
      {
        value: 'sumTips', text: capitalize(translate('tips')),
      },
      {
        value: 'sumBits', text: capitalize(translate('bits')),
      },
      {
        value: 'giftedSubscribes', text: capitalize(translate('subgifts')),
      },
      {
        value: 'subscribeCumulativeMonths', text: capitalize(translate('subCumulativeMonths')),
      },
      {
        value: 'subscribeStreak', text: capitalize(translate('subStreak')),
      },
      {
        text: '', value: 'data-table-expand',
      },
    ];

    const refresh = () => {
      state.value.loading = ButtonStates.progress;
      console.time('find.viewers');
      getSocket('/core/users').emit('find.viewers', {
        perPage: perPage.value,
        page:    (currentPage.value - 1),
        order:   {
          orderBy: sortBy.value, sortOrder: sortDesc.value ? 'DESC' : 'ASC',
        },
        filter: filter.value,
        search: search.value.length > 0 ? search.value : undefined,
      }, (err: string | null, items_: Required<UserInterface>[], count_: number) => {
        if (err) {
          return console.error(err);
        }
        items.value = items_;
        count.value = count_;
        state.value.loading = ButtonStates.success;

        // we also need to reset selection values
        if (selected.value.length > 0) {
          selected.value.forEach((selectedItem, index) => {
            selectedItem = items.value.find(o => o.userId === selectedItem.userId) || selectedItem;
            selected.value[index] = selectedItem;
          });
        }
        console.timeEnd('find.viewers');
        timestamp.value = new Date().toISOString();
      });
    };

    onMounted(() => {
      refresh();
    });

    const saveSuccess = () => {
      refresh();
      EventBus.$emit('snack', 'success', 'Data updated.');
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
            const toUpdate: Record<string, any> = {
            };
            if (attr === 'isFollower') {
              toUpdate.isFollower = item.isFollower;
              toUpdate.haveFollowerLock = item.haveFollowerLock;
            } else if (attr === 'isSubscriber') {
              toUpdate.isSubscriber = item.isSubscriber;
              toUpdate.haveSubscriberLock = item.haveSubscriberLock;
            } else if (attr === 'followedAt') {
              toUpdate.followedAt = item.followedAt;
              toUpdate.haveFollowedAtLock = item.haveFollowedAtLock;
            } else if (attr === 'subscribedAt') {
              toUpdate.subscribedAt = item.subscribedAt;
              toUpdate.haveSubscribedAtLock = item.haveSubscribedAtLock;
            } else {
              toUpdate[attr] = item[attr];
            }
            console.log('Updating', itemToUpdate.userId, {
              toUpdate,
            });

            getSocket('/core/users').emit('viewers::update', [itemToUpdate.userId, toUpdate], (err: string | null) => {
              if (err) {
                console.error(err);
              }
              resolve(true);
            });
          });
        }),
      );
      refresh();
      EventBus.$emit('snack', 'success', 'Data updated.');
    };

    const forceCheckFollowedAt = (item: UserInterface) => {
      state.value.forceCheckFollowedAt = ButtonStates.progress;
      getSocket('/core/users').emit('viewers::followedAt', item.userId, (err: string | null, followedAt: number) => {
        state.value.forceCheckFollowedAt = ButtonStates.idle;
        if (err) {
          if (err.includes('Not a follower') && item) {
            (item.followedAt as any) = null;
          }
          return console.error(err);
        } else if (item) {
          item.followedAt = followedAt;
        }
      });
    };

    const resetPoints = () => {
      getSocket('/core/users').emit('viewers::resetPointsAll', () => {
        refresh();
      });
    };

    const resetWatchedTime = () => {
      getSocket('/core/users').emit('viewers::resetWatchedTimeAll', () => {
        refresh();
      });
    };

    const resetMessages = () => {
      getSocket('/core/users').emit('viewers::resetMessagesAll', () => {
        refresh();
      });
    };

    const resetBits = () => {
      getSocket('/core/users').emit('viewers::resetBitsAll', () => {
        refresh();
      });
    };

    const resetTips = () => {
      getSocket('/core/users').emit('viewers::resetTipsAll', () => {
        refresh();
      });
    };

    const resetSubgifts = () => {
      getSocket('/core/users').emit('viewers::resetSubgiftsAll', () => {
        refresh();
      });
    };

    const deleteSelected = async () => {
      deleteDialog.value = false;
      await Promise.all(
        selected.value.map((item) => {
          return new Promise((resolve, reject) => {
            getSocket('/core/users').emit('viewers::remove', item, (err: string | null) => {
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

    const watchedTimeFormat = (value: number) => {
      return (value / 1000 / 60 / 60).toFixed(2);
    };

    function setWatchedTime (item: typeof items.value[number], value: string | number) {
      item.watchedTime = Number(String(value).replace(/\s/g, '')) * 1000 * 60 * 60;
    }

    return {
      addToSelectedItem: addToSelectedItem(selected, 'userId', currentItems),
      selectable,
      orderBy,
      headers,
      search,
      items,
      currentPage,
      sortBy,
      perPage,
      headersDelete,
      sortDesc,
      count,
      state,
      selected,
      expanded,
      filter,
      translate,
      rules,
      saveSuccess,
      update,
      refresh,
      capitalize,
      fItems,
      forceCheckFollowedAt,
      timestamp,
      dayjs,
      lockBackup,
      headersHistory,
      history,
      deleteDialog,
      deleteSelected,
      saveCurrentItems,

      resetTips,
      resetBits,
      resetMessages,
      resetWatchedTime,
      resetPoints,
      resetSubgifts,
      watchedTimeFormat,
      ButtonStates,

      setWatchedTime,
    };
  },
});
</script>

<style>
.dividerEdit .v-small-dialog__activator__content {
  width: 100%;
  transform: translateY(-4px);
}
</style>
