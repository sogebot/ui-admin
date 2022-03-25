<template>
  <v-card
    id="5b90af97-ad95-4776-89e3-9a59c67510e5"
    :loading="isLoading"
    width="100%"
    :height="isPopout ? '100%' : undefined"
    style="overflow: inherit"
    flat
  >
    <v-card-text class="pa-0 ma-0">
      <v-tabs
        v-model="tab"
        height="36"
        background-color="blue-grey darken-4"
        grow
      >
        <v-tab>Raffle</v-tab>
        <v-tab>Participants</v-tab>
        <v-tab>Winner</v-tab>
      </v-tabs>

      <v-tabs-items v-model="tab" :style="{ height: (height || 0) - 36 + 'px' }">
        <v-tab-item>
          <v-form v-model="valid" lazy-validation>
            <v-text-field
              v-model="keyword"
              filled
              label="Raffle command"
              :rules="commandRule"
              :disabled="running"
              hide-details
            >
              <template #append>
                <v-progress-circular v-if="running" indeterminate size="20" />
              </template>
            </v-text-field>

            <v-autocomplete
              v-model="eligible"
              :disabled="running"
              filled
              hide-details
              multiple
              :label="translate('eligible-to-enter')"
              :items="eligibleItems"
            />

            <v-select
              v-model="isTypeKeywords"
              :disabled="running"
              filled
              :items="typeItems"
              :label="translate('raffle-type')"
              item-value="value"
              hide-details
            />

            <v-expand-transition>
              <div v-if="!isTypeKeywords" class="pa-4">
                <div style="font-size: 12px;" class="pa-0 ma-0">
                  {{ translate('raffle-tickets-range') }}
                </div>
                <v-range-slider
                  v-model="range"
                  :disabled="running"
                  filled
                  :max="100000"
                  :min="0"
                  hide-details
                  class="align-center mb-2"
                >
                  <template #prepend>
                    <v-text-field
                      :value="range[0]"
                      class="mt-0 pt-0"
                      hide-details
                      single-line
                      type="number"
                      style="width: 60px;"
                      @change="$set(range, 0, $event)"
                    />
                  </template>
                  <template #append>
                    <v-text-field
                      :value="range[1]"
                      class="mt-0 pt-0"
                      hide-details
                      single-line
                      type="number"
                      style="width: 60px;"
                      @change="$set(range, 1, $event)"
                    />
                  </template>
                </v-range-slider>
              </div>
            </v-expand-transition>

            <transition-group name="fade">
              <div v-if="!running" key="open-raffle-button" style="width: 100%;">
                <v-btn
                  color="success"
                  :disabled="!valid"
                  block
                  @click="open"
                >
                  Open raffle
                </v-btn>
              </div>
              <div v-else key="running-raffle-buttons" style="width: 100%;">
                <v-btn
                  key="close-raffle-button"
                  color="error"
                  class="mb-2"
                  block
                  @click="close"
                >
                  Close raffle
                </v-btn>
                <v-btn block @click="pickWinner">
                  Pick Winner
                </v-btn>
              </div>
            </transition-group>
          </v-form>
        </v-tab-item>
        <v-tab-item>
          <v-text-field v-model="search" filled dense hide-details label="Search" />
          <div :style="{ 'max-height': (height || 0) - 36 - 52 + 'px' }" style="overflow: auto; overflow-x: clip;">
            <v-list dense style="column-count: 3; column-fill: balance;">
              <v-fade-transition group>
                <v-list-item
                  style="break-inside: avoid;"
                  v-for="participant of fParticipants"
                  :key="participant.id"
                  @click="toggleEligibility(participant)"
                >
                  <v-icon v-if="participant.isEligible" class="pr-2" color="success">
                    mdi-check-circle-outline
                  </v-icon>
                  <v-icon v-else class="pr-2" color="error">
                    mdi-checkbox-blank-circle-outline
                  </v-icon>
                  {{ participant.username }}
                </v-list-item>
              </v-fade-transition>
              <v-fade-transition>
                <v-list-item v-if="Math.abs(fParticipants.length - participants.length) > 0">
                  <v-icon class="pr-2">
                    mdi-eye-off
                  </v-icon>
                  <span class="grey--text">{{ Math.abs(fParticipants.length - participants.length) }} {{ translate('hidden') }}</span>
                </v-list-item>
              </v-fade-transition>
            </v-list>
          </div>
        </v-tab-item>
        <v-tab-item>
          <div
            v-if="!winner"
            class="font-weight-light text-center pa-3 m-auto"
          >
            No winner was picked yet
          </div>
          <div
            v-else
            class="font-weight-light pa-3"
          >
            <div class="text-h5 m-auto text-center text-uppercase">
              {{ winner.userName }}
            </div>
            <v-row no-gutters class="m-auto text-center">
              <v-col :class="{'text-decoration-line-through': !winner.isFollower }">
                {{ translate('follower') }}
              </v-col>
              <v-col :class="{'text-decoration-line-through': !winner.isSubscriber }">
                {{ translate('subscriber') }}
              </v-col>
            </v-row>

            <v-card-actions class="px-0">
              <v-btn v-if="countEligibleParticipants > 0" block @click="pickWinner">
                <v-icon class="pr-2">
                  mdi-sync
                </v-icon> {{ translate('roll-again') }}
              </v-btn>
              <v-btn v-else block disabled>
                <v-icon class="pr-2">
                  mdi-sync-off
                </v-icon> {{ translate('no-eligible-participants') }}
              </v-btn>
            </v-card-actions>

            <div class="text-button">
              <v-icon>mdi-comment-multiple</v-icon> {{ translate('messages') }}
            </div>
            <v-simple-table v-if="winnerMessages.length > 0">
              <template #default>
                <tbody>
                  <tr
                    v-for="message in winnerMessages"
                    :key="message.timestamp"
                  >
                    <td>{{ message.text }}</td>
                    <td>{{ dayjs(message.timestamp).format('LL') }} {{ dayjs(message.timestamp).format('LTS') }}</td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
            <div
              v-else
              class="font-weight-light text-center pa-3 m-auto"
            >
              No messages from winner yet
            </div>
          </div>
        </v-tab-item>
      </v-tabs-items>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import type { RaffleInterface } from '@entity/raffle';
import { UserInterface } from '@entity/user';
import {
  computed,
  defineComponent, onMounted, ref, watch,
} from '@nuxtjs/composition-api';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';

import { error } from '~/functions/error';
import {
  minLength, required, startsWith,
} from '~/functions/validators';

export default defineComponent({
  props: { height: Number },
  setup () {
    const isPopout = computed(() => location.href.includes('popout'));
    const tab = ref(0);
    const isLoading = ref(true);

    const commandRule = [
      required, startsWith(['!']), minLength(2),
    ];

    const search = ref('');
    const valid = ref(true);
    const updated = ref(Date.now());
    const participants = ref([] as RaffleInterface['participants']);
    const running = ref(false);
    const winner = ref(null as null | UserInterface);
    const keyword = ref('');
    const isTypeKeywords = ref(false);
    const range = ref([0, 1000]);
    const eligible = ref(['all']);
    watch(eligible, (val, old) => {
      if ((val.includes('all') && !old.includes('all'))
        || val.length === 0) {
        // we picked all, unselect subs and followers
        eligible.value = ['all'];
      }
      if ((val.includes('followers') || val.includes('subscribers')) && old.includes('all')) {
        // we picked all, unselect subs and followers
        eligible.value = eligible.value.filter(o => o !== 'all');
      }
    });

    const eligibleItems = [
      { text: translate('everyone'), value: 'all' },
      { text: translate('followers'), value: 'followers' },
      { text: translate('subscribers'), value: 'subscribers' },
    ];
    const typeItems = [
      { text: translate('raffle-type-keywords'), value: true },
      { text: translate('raffle-type-tickets'), value: false },
    ];
    const fParticipants = computed(() => {
      if (search.value.trim().length === 0) {
        return participants.value;
      } else {
        return participants.value.filter(o => o.username.includes(search.value.trim()));
      }
    });
    const winnerMessages = computed(() => {
      if (winner.value) {
        const messages = participants.value.find(o => o.username === winner.value?.userName)?.messages ?? [];
        return messages.slice(Math.max(messages.length - 5, 0));
      } else {
        return [];
      }
    });
    const countEligibleParticipants = computed(() => {
      return (participants.value.filter(o => o.isEligible)).length;
    });

    watch(keyword, (val) => {
      if (!val.startsWith('!')) {
        keyword.value = '!' + val;
      }
    });

    onMounted(() => {
      const cache = localStorage.getItem('/widget/raffles/');
      if (cache) {
        const parsed = JSON.parse(cache);
        eligible.value = parsed.eligible;
        isTypeKeywords.value = parsed.isTypeKeywords;
        keyword.value = parsed.keyword;
        range.value[1] = parsed.ticketsMax;
        range.value[0] = parsed.ticketsMin;
      }

      // better would be to have watcher, but there is no simple way
      // to catch all relevant props without lot of a code
      setInterval(() => {
        localStorage.setItem('/widget/raffles/', JSON.stringify({
          eligible:       eligible.value,
          isTypeKeywords: isTypeKeywords.value,
          keyword:        keyword.value,
          ticketsMax:     range.value[1],
          ticketsMin:     range.value[0],
        }));
      }, 1000);

      setInterval(() => refresh(), 1000);
    });

    function refresh () {
      getSocket('/systems/raffles').emit('raffle:getLatest', (err, raffle: RaffleInterface) => {
        console.groupCollapsed('raffle:getLatest');
        console.log({ err, raffle });
        console.groupEnd();
        isLoading.value = false;
        if (err) {
          error(err);
        }
        if (raffle) {
          participants.value = raffle.participants;
          running.value = !raffle.isClosed;

          if (!raffle.winner) {
            winner.value = null;
          } else if (winner.value === null || winner.value.userName !== raffle.winner) {
            getSocket('/systems/raffles').emit('raffle::getWinner', raffle.winner, (err2, user: UserInterface) => {
              if (err2) {
                error(err2);
              }
              winner.value = user;
            });
          }

          if (running.value) {
            keyword.value = raffle.keyword;
            isTypeKeywords.value = raffle.type === 0;
            range.value[1] = raffle.maxTickets ?? 0;
            range.value[0] = raffle.minTickets ?? 0;

            // set eligibility
            if (!raffle.forSubscribers && !raffle.forFollowers) {
              eligible.value = ['all'];
            } else {
              eligible.value = [];
              if (raffle.forFollowers) {
                eligible.value.push('followers');
              }
              if (raffle.forSubscribers) {
                eligible.value.push('subscribers');
              }
            }
          }
        }
      });
    }

    function toggleEligibility (participant: typeof participants.value[number]) {
      participant.isEligible = !participant.isEligible;
      getSocket('/systems/raffles').emit('raffle::setEligibility', { id: participant.id, isEligible: participant.isEligible }, (err) => {
        if (err) {
          return error(err);
        }
      });
    }
    function open () {
      const out = [];
      out.push(keyword.value);
      if (eligible.value.includes('followers') || eligible.value.includes('subscribers')) {
        out.push('-for ' + (eligible.value.includes('followers') ? 'followers' : ' ') + (eligible.value.includes('subscribers') ? 'subscribers' : ' '));
      }

      if (!isTypeKeywords.value) {
        out.push(`-min ${range.value[0]}`);
        out.push(`-max ${range.value[1]}`);
      }
      console.group('raffles open()');
      console.debug('out: ', out.join(' '));
      console.groupEnd();
      getSocket('/systems/raffles').emit('raffle::open', out.join(' '));
    }
    function close () {
      getSocket('/systems/raffles').emit('raffle::close');
      running.value = false;
    }
    function pickWinner () {
      getSocket('/systems/raffles').emit('raffle::pick');
      tab.value = 2;
    }

    return {
      // refs
      isPopout,
      tab,
      search,
      participants,
      running,
      winner,
      keyword,
      isTypeKeywords,
      range,
      eligible,
      fParticipants,
      winnerMessages,
      countEligibleParticipants,
      updated,
      valid,
      commandRule,
      isLoading,
      eligibleItems,
      typeItems,

      // functions
      toggleEligibility,
      open,
      close,
      pickWinner,

      // helpers
      translate,
      dayjs,
    };
  },
});
</script>
