<template>
  <v-card id="5b90af97-ad95-4776-89e3-9a59c67510e5" width="100%" :height="isPopout ? '100%' : undefined" flat>
    <v-card-text class="pa-0 ma-0">
      <v-tabs
        v-model="tab"
        height="36"
        background-color="blue-grey darken-4"
        grow
      >
        <v-tab>Pick users</v-tab>
        <v-tab>Show picked</v-tab>
      </v-tabs>
      <v-tabs-items v-model="tab">
        <v-tab-item>
          <v-toolbar height="36" color="blue-grey darken-4">
            <v-btn-toggle
              v-model="eligibility"
              multiple
              dense
            >
              <v-btn text small>
                ALL
              </v-btn>
              <v-btn text small>
                SUBSCRIBERS
              </v-btn>
            </v-btn-toggle>

            <v-spacer />

            <v-tooltip bottom>
              <template #activator="{ on, attrs }">
                <v-btn
                  icon
                  height="36"
                  width="36"
                  v-bind="attrs"
                  @click="clear"
                  v-on="on"
                >
                  <v-icon>mdi-backspace</v-icon>
                </v-btn>
              </template>
              <span>Clear list</span>
            </v-tooltip>

            <v-tooltip bottom>
              <template #activator="{ on, attrs }">
                <v-btn
                  :color="locked ? 'red lighten-1' : 'green lighten-1'"
                  icon
                  height="36"
                  width="36"
                  v-bind="attrs"
                  @click="locked = !locked"
                  v-on="on"
                >
                  <v-icon v-if="locked">
                    mdi-lock
                  </v-icon>
                  <v-icon v-else>
                    mdi-lock-open-variant
                  </v-icon>
                </v-btn>
              </template>
              <span>{{ locked ? 'Queue locked' : 'Queue opened' }}</span>
            </v-tooltip>
          </v-toolbar>

          <v-text-field
            v-model.number="selectCount"
            label="Select count to pick"
            dense
            filled
            hide-details
            type="number"
            min="1"
          />

          <v-row no-gutters class=" pt-2">
            <v-col>
              <v-btn v-if="selectedUsers.length > 0" block text @click="pickSelected">
                Pick {{ selectedUsers.length }} selected
              </v-btn>
              <v-btn v-else block text :disabled="fUsers.length === 0" @click="pick(false)">
                Pick first {{ selectCount }}
              </v-btn>
            </v-col>
            <v-col>
              <v-btn block text :disabled="fUsers.length === 0" @click="pick(true)">
                Pick random {{ selectCount }}
              </v-btn>
            </v-col>
          </v-row>

          <v-list dense :height="height - 36" style="overflow: auto;">
            <v-list-item-group
              v-model="selectedUsers"
              multiple
            >
              <v-list-item
                v-for="user of fUsers"
                :key="user.id"
              >
                <v-container fluid class="pa-0 ma-0">
                  <v-row no-gutters>
                    <v-col>
                      <strong>{{ user.username }}</strong>
                    </v-col>
                    <v-col>
                      <code v-if="user.isSubscriber">SUBSCRIBER</code>
                    </v-col>
                    <v-col>
                      <div v-if="user.message">
                        {{ user.message }}
                      </div>
                    </v-col>
                  </v-row>
                  <v-row no-gutters>
                    <v-col cols="12">
                      <small>{{ dayjs(user.createdAt).format('LL') }} {{ dayjs(user.createdAt).format('LTS') }}</small>
                    </v-col>
                  </v-row>
                </v-container>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </v-tab-item>
        <v-tab-item>
          <div
            v-if="picked.length === 0"
            :style="{ height: !isPopout ? height + 98 + 34 + 'px' : 'inherit' }"
            class="font-weight-light text-center pa-3 m-auto"
          >
            No users were picked yet
          </div>
          <v-list v-else dense :height="!isPopout ? height + 98 + 34 : null" style="overflow: auto;">
            <v-list-item
              v-for="user of picked"
              :key="user.id"
            >
              <v-container fluid class="pa-0 ma-0">
                <v-row no-gutters>
                  <v-col>
                    <strong>{{ user.username }}</strong>
                  </v-col>
                  <v-col>
                    <code v-if="user.isSubscriber">SUBSCRIBER</code>
                  </v-col>
                  <v-col>
                    <div v-if="user.message">
                      {{ user.message }}
                    </div>
                  </v-col>
                </v-row>
              </v-container>
            </v-list-item>
          </v-list>
        </v-tab-item>
      </v-tabs-items>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { QueueInterface } from '@entity/queue';
import {
  computed,
  defineComponent, onMounted, ref, watch,
} from '@nuxtjs/composition-api';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { debounce } from 'lodash';

import { error } from '~/functions/error';

export default defineComponent({
  props: { height: Number },
  setup () {
    const isPopout = computed(() => location.href.includes('popout'));

    const picked = ref([] as QueueInterface[]);
    const users = ref([] as QueueInterface[]);
    const selectedUsers = ref([] as number[]);
    const locked = ref(true);
    const updated = ref(Date.now());
    const selectCount = ref(1);
    const eligibility = ref([0]);
    const tab = ref(0);

    watch(selectCount, (val) => {
      if (val < 1) {
        selectCount.value = 1;
      }
    });

    onMounted(() => {
      setInterval(() => getSocket('/systems/queue').emit('queue::getAllPicked', (err, users2: QueueInterface[]) => {
        if (err) {
          return error(err);
        }
        picked.value = users2;
      }), 1000);

      setInterval(() => getSocket('/systems/queue').emit('generic::getAll', (err, usersGetAll: QueueInterface[]) => {
        if (err) {
          return error(err);
        }
        users.value = usersGetAll;
      }), 1000);

      getSocket('/systems/queue').emit('settings', (err, data: any) => {
        if (err) {
          return error(err);
        }
        if (data.eligibility.eligibilityAll[0] && !eligibility.value.includes(0)) {
          eligibility.value.push(0);
        }
        if (data.eligibility.eligibilitySubscribers[0] && !eligibility.value.includes(0)) {
          eligibility.value.push(1);
        }
      });
      getSocket('/systems/queue').emit('get.value', 'locked', (err, locked2: boolean) => {
        if (err) {
          return error(err);
        }
        locked.value = locked2;
      });
    });

    watch(locked, () => (updated.value = Date.now()));
    watch(eligibility, (val, old) => {
      if ((val.includes(0) && !old.includes(0))
        || val.length === 0) {
        // we picked all, unselect subs
        eligibility.value = [0];
      }
      if (val.includes(1) && old.includes(0)) {
        // we picked all, unselect subs
        eligibility.value = eligibility.value.filter(o => o !== 0);
      }
    });
    watch(updated, debounce(function () {
      const data = {
        eligibility: {
          eligibilityAll:         eligibility.value.includes(0),
          eligibilitySubscribers: eligibility.value.includes(1),
        },
      };
      getSocket('/systems/queue').emit('settings.update', data, () => {
        return true;
      });
      getSocket('/systems/queue').emit('set.value', { variable: 'locked', value: locked.value }, () => {
        return true;
      });
    }, 500));

    const fUsers = computed(() => {
      if (eligibility.value.includes(0)) {
        return users.value;
      } else {
        let filteredUsers = users.value;
        if (eligibility.value.includes(1)) {
          filteredUsers = filteredUsers.filter(o => o.isSubscriber);
        }
        return filteredUsers.sort(o => -(new Date(o.createdAt).getTime()));
      }
    });

    function clear () {
      getSocket('/systems/queue').emit('queue::clear', (err) => {
        if (err) {
          return error(err);
        }
      });
    }
    function pick (random: boolean) {
      const data = {
        random,
        count: selectCount.value,
      };
      getSocket('/systems/queue').emit('queue::pick', data, (err, users2) => {
        if (err) {
          return error(err);
        }
        if (users2) {
          picked.value = users2;
          selectedUsers.value = [];
          tab.value = 1;
        }
      });
    }
    function pickSelected () {
      const data = {
        username: selectedUsers.value.map(idx => fUsers.value[idx].username),
        random:   false,
        count:    0,
      };
      getSocket('/systems/queue').emit('queue::pick', data, (err, users2) => {
        if (err) {
          return error(err);
        }
        if (users2) {
          picked.value = users2;
          selectedUsers.value = [];
          tab.value = 1;
        }
      });
    }

    return {
      // refs
      fUsers,
      locked,
      updated,
      isPopout,
      picked,
      users,
      selectedUsers,
      selectCount,
      eligibility,
      tab,

      // functions
      clear,
      pick,
      pickSelected,

      // helpers
      translate,
      dayjs,
    };
  },
});
</script>
