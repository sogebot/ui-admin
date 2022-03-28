<template>
  <v-card id="5b90af97-ad95-4776-89e3-9a59c67510e4" width="100%" :loading="isLoading" style="overflow: inherit" flat>
    <v-toolbar height="36" color="blue-grey darken-4" class="mb-1" :rounded="false">
      <v-spacer />
      <v-btn
        v-if="selected.length > 0"
        color="red"
        icon
        height="36"
        width="36"
        @click="removeSelected"
      >
        <v-icon>mdi-delete-forever</v-icon> {{ selected.length }}
      </v-btn>

      <v-tooltip bottom>
        <template #activator="{ on: onTooltip }">
          <v-menu
            v-model="menu"
            :close-on-content-click="false"
            :nudge-width="200"
            offset-x
          >
            <template #activator="{ on, attrs }">
              <v-btn
                icon
                height="36"
                width="36"
                title="Filter alerts"
                v-bind="attrs"
                v-on="{...on, ...onTooltip}"
              >
                <v-icon>mdi-filter-menu</v-icon>
              </v-btn>
            </template>

            <v-card min-width="300">
              <v-card-text>
                <v-row>
                  <v-col>
                    <v-checkbox v-model="showFollows" label="Follows" class="pa-0 ma-0" hide-details />
                    <v-checkbox v-model="showHosts" label="Hosts" class="pa-0 ma-0" hide-details />
                    <v-checkbox v-model="showBits" label="Bits" class="pa-0 ma-0" hide-details />
                    <v-checkbox v-model="showRaids" label="Raids" class="pa-0 ma-0" hide-details />
                    <v-checkbox v-model="showRedeems" label="Reward Redeems" class="pa-0 ma-0" hide-details />
                    <v-checkbox v-model="showSubGifts" label="Subscription gifts" class="pa-0 ma-0" hide-details />
                    <v-checkbox v-model="showSubCommunityGifts" label="Subscription community gifts" class="pa-0 ma-0" hide-details />
                  </v-col>
                  <v-col>
                    <v-checkbox v-model="showSubs" label="Subs" class="pa-0 ma-0" hide-details />
                    <v-divider class="pa-1 ma-1" />
                    <v-checkbox v-model="showSubsPrime" label="Prime" class="pa-0 ma-0 pl-2" hide-details :disabled="!showSubs" />
                    <v-checkbox v-model="showSubsTier1" label="Tier 1" class="pa-0 ma-0 pl-2" hide-details :disabled="!showSubs" />
                    <v-checkbox v-model="showSubsTier2" label="Tier 2" class="pa-0 ma-0 pl-2" hide-details :disabled="!showSubs" />
                    <v-checkbox v-model="showSubsTier3" label="Tier 3" class="pa-0 ma-0 pl-2" hide-details :disabled="!showSubs" />
                  </v-col>
                </v-row>
                <v-row>
                  <v-col>
                    <v-checkbox v-model="showResubs" label="Resubs" class="pa-0 ma-0" hide-details />
                    <v-divider class="pa-1 ma-1" />
                    <v-checkbox v-model="showResubsPrime" label="Prime" class="pa-0 ma-0 pl-2" hide-details :disabled="!showResubs" />
                    <v-checkbox v-model="showResubsTier1" label="Tier 1" class="pa-0 ma-0 pl-2" hide-details :disabled="!showResubs" />
                    <v-checkbox v-model="showResubsTier2" label="Tier 2" class="pa-0 ma-0 pl-2" hide-details :disabled="!showResubs" />
                    <v-checkbox v-model="showResubsTier3" label="Tier 3" class="pa-0 ma-0 pl-2" hide-details :disabled="!showResubs" />
                    <v-row no-gutters class="pl-2">
                      <v-col style="align-self: flex-end;">
                        <v-checkbox v-model="showResubsMinimal" class="pa-0 ma-0" label="Minimum" :disabled="!showResubs" />
                      </v-col>
                      <v-col>
                        <v-text-field v-model.number="showResubsMinimalAmount" type="number" single-line dense :disabled="!showResubs || !showResubsMinimal">
                          <template #append>
                            months
                          </template>
                        </v-text-field>
                      </v-col>
                    </v-row>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col>
                    <v-checkbox v-model="showTips" label="Tips" class="pa-0 ma-0" hide-details />
                    <v-divider class="pa-1 ma-1" />
                    <v-row no-gutters class="pl-2">
                      <v-col style="align-self: flex-end;">
                        <v-checkbox v-model="showTipsMinimal" class="pa-0 ma-0" label="Minimum" :disabled="!showTips" />
                      </v-col>
                      <v-col>
                        <v-text-field v-model.number="showTipsMinimalAmount" type="number" single-line dense :disabled="!showTips || !showTipsMinimal">
                          <template #append>
                            {{ $store.state.configuration.currency }}
                          </template>
                        </v-text-field>
                      </v-col>
                    </v-row>
                  </v-col>
                </v-row>
              </v-card-text>

              <v-card-actions>
                <v-spacer />
                <v-btn
                  color="primary"
                  text
                  @click="menu = false"
                >
                  Close
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-menu>
        </template>
        <span>Filter Alerts</span>
      </v-tooltip>

      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            icon
            height="36"
            width="36"
            v-bind="attrs"
            @click="emitSkipAlertEvent()"
            v-on="on"
          >
            <v-icon>mdi-skip-next</v-icon>
          </v-btn>
        </template>
        <span>Skip alert</span>
      </v-tooltip>

      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            icon
            height="36"
            width="36"
            v-bind="attrs"
            :color="isTTSMuted ? 'grey' : 'white'"
            v-on="on"
            @click="isTTSMuted = !isTTSMuted"
          >
            <v-icon v-if="isTTSMuted">
              mdi-text-to-speech-off
            </v-icon>
            <v-icon v-else>
              mdi-text-to-speech
            </v-icon>
          </v-btn>
        </template>
        <span>{{ isTTSMuted ? 'TTS is disabled.' : 'TTS is enabled!' }}</span>
      </v-tooltip>

      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            icon
            height="36"
            width="36"
            v-bind="attrs"
            :color="isSoundMuted ? 'grey' : 'white'"
            v-on="on"
            @click="isSoundMuted = !isSoundMuted"
          >
            <v-icon v-if="isSoundMuted">
              mdi-volume-mute
            </v-icon>
            <v-icon v-else>
              mdi-volume-high
            </v-icon>
          </v-btn>
        </template>
        <span>{{ isSoundMuted ? 'Sound is muted.' : 'Sound is enabled!' }}</span>
      </v-tooltip>

      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            icon
            height="36"
            width="36"
            v-bind="attrs"
            :color="areAlertsMuted ? 'grey' : 'white'"
            v-on="on"
            @click="areAlertsMuted = !areAlertsMuted"
          >
            <v-icon v-if="areAlertsMuted">
              mdi-bell-cancel
            </v-icon>
            <v-icon v-else>
              mdi-bell-ring
            </v-icon>
          </v-btn>
        </template>
        <span>{{ areAlertsMuted ? 'Alerts are disabled.' : 'Alerts are enabled!' }}</span>
      </v-tooltip>
    </v-toolbar>

    <v-list class="pa-0 ma-0" style="overflow: auto;" :height="height - 36" dense>
      <v-list-item-group
        v-model="selected"
        multiple
      >
        <template v-for="(item, index) in events">
          <v-hover v-if="filter(item)" v-slot="{ hover }" :key="item.id + 'hover'">
            <v-list-item>
              <v-list-item-content>
                <v-overlay :value="hover" absolute>
                  <v-btn
                    @click.stop="resendAlert(item.id)"
                  >
                    <v-icon left>
                      mdi-refresh
                    </v-icon> Resend Alert
                  </v-btn>
                </v-overlay>
                <v-row no-gutters>
                  <v-col>
                    <v-list-item-title>
                      <span class="font-condensed font-weight-bold" style="font-size: 1.2rem;">{{ item.username.toUpperCase() }}</span> <span v-html="prepareMessage(item)" />
                    </v-list-item-title>

                    <v-row v-if="blockquote(item)" no-gutters class="pt-2">
                      <v-col cols="auto">
                        <v-icon color="accent" x-small style="transform: translateY(5px);">
                          mdi-format-quote-open
                        </v-icon>
                        <span v-html="blockquote(item)" />
                        <v-icon color="accent" x-small style="transform: translateY(-5px);">
                          mdi-format-quote-close
                        </v-icon>
                      </v-col>
                    </v-row>
                  </v-col>

                  <v-col cols="auto" align-self="center">
                    <v-list-item-subtitle v-text="dayjs(item.timestamp).fromNow()" />
                  </v-col>
                </v-row>
              </v-list-item-content>

              <v-list-item-action>
                <div v-if="item.event === 'follow'" class="red--text text--lighten-1 font-condensed" style="font-size:1.2rem;">
                  follow
                </div>
                <div v-else-if="item.event === 'host'" class="orange--text text--lighten-1 font-condensed" style="font-size: 1.5rem;">
                  <v-icon size="15" color="orange">
                    mdi-account-group
                  </v-icon>
                  {{ JSON.parse(item.values_json).viewers }}
                </div>
                <div v-else-if="item.event === 'raid'" class="lime--text text--lighten-1 font-condensed" style="font-size: 1.5rem;">
                  <v-icon size="15" color="lime">
                    mdi-account-group
                  </v-icon>
                  {{ JSON.parse(item.values_json).viewers }}
                </div>
                <div v-else-if="item.event === 'sub'" class="indigo--text text--lighten-1 font-condensed" style="font-size: 1.2rem;">
                  {{ JSON.parse(item.values_json).tier !== 'Prime' ? 'Tier ' + JSON.parse(item.values_json).tier : JSON.parse(item.values_json).tier }}
                </div>
                <div v-else-if="item.event === 'subgift'" class="pink--text text--lighten-1 font-condensed" style="font-size: 1.2rem;">
                  <v-icon size="15" color="pink">
                    mdi-gift-open
                  </v-icon>
                  {{ JSON.parse(item.values_json).fromId }}
                </div>
                <div v-else-if="item.event === 'subcommunitygift'" class="orange--text text--lighten-1 font-condensed" style="font-size: 1.5rem;">
                  <v-icon size="15" color="orange">
                    mdi-gift
                  </v-icon>
                  {{ JSON.parse(item.values_json).count }}
                </div>
                <div v-else-if="item.event === 'resub'" class="deep-purple--text text--lighten-3 font-condensed" style="font-size: 1.5rem;">
                  <span v-if="JSON.parse(item.values_json).subStreakShareEnabled" class="orange--text">
                    <v-icon size="15" color="orange">mdi-fire</v-icon>{{ JSON.parse(item.values_json).subStreak }}&nbsp;
                  </span>

                  <span style="font-size:1.2rem;">{{ JSON.parse(item.values_json).tier !== 'Prime' ? 'Tier ' + JSON.parse(item.values_json).tier : JSON.parse(item.values_json).tier }}</span>
                  <span style="font-size:1.2rem;">x</span>{{ JSON.parse(item.values_json).subCumulativeMonths }}
                </div>
                <div v-else-if="item.event === 'cheer'" class="yellow--text text--lighten-1 font-condensed" style="font-size: 1.5rem;">
                  {{ JSON.parse(item.values_json).bits }}
                  <v-icon size="15" color="yellow">
                    mdi-diamond
                  </v-icon>
                </div>
                <div v-else-if="item.event === 'tip'" class="light-green--text text--lighten-1 font-condensed" style="font-size:1.5rem;">
                  {{ Intl.NumberFormat($store.state.configuration.lang, { style: 'currency', currency: get(JSON.parse(item.values_json), 'currency', 'USD') }).format(get(JSON.parse(item.values_json), 'amount', '0')) }}
                </div>
                <div v-else-if="item.event === 'rewardredeem'" class="blue--text text--lighten-1 font-condensed" style="font-size:1.2rem;">
                  {{ JSON.parse(item.values_json).titleOfReward }}
                </div>
              </v-list-item-action>
            </v-list-item>
          </v-hover>

          <v-divider
            v-if="index < events.length - 1 && filter(item)"
            :key="item.id + 'divider'"
          />
        </template>
      </v-list-item-group>
    </v-list>
  </v-card>
</template>

<script lang="ts">
import type { EventListInterface } from '@entity/eventList';
import {
  computed,
  defineComponent, onMounted, ref, useStore, watch,
} from '@nuxtjs/composition-api';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  useMutation, useQuery, useResult,
} from '@vue/apollo-composable';
import { get } from 'lodash';

import GET_CFG from '~/queries/alert/getCfg.gql';
import SET_CFG from '~/queries/alert/setCfg.gql';

export default defineComponent({
  props: { height: Number },
  setup () {
    const store = useStore<any>();

    const areAlertsMuted = ref(false);
    const isTTSMuted = ref(false);
    const isSoundMuted = ref(false);

    const { result } = useQuery(GET_CFG);
    const cache = useResult<{
      areAlertsMuted: boolean,
      isTTSMuted: boolean,
      isSoundMuted: boolean,
    }>(result);
    watch(cache, (value) => {
      if (!value) {
        return;
      }

      areAlertsMuted.value = value.areAlertsMuted;
      isTTSMuted.value = value.isTTSMuted;
      isSoundMuted.value = value.isSoundMuted;
    }, { immediate: true, deep: true });
    const { mutate: saveMutation } = useMutation(SET_CFG);

    const isLoading = ref(true);
    const events = ref([] as (EventListInterface & { sortAmount: number })[]);
    const selected = ref([] as number[]);
    const menu = ref(false);
    const isPopout = computed(() => location.href.includes('popout'));

    const showFollows = ref((localStorage.showFollows && localStorage.showFollows === 'true') ?? true);
    const showRedeems = ref((localStorage.showRedeems && localStorage.showRedeems === 'true') ?? true);
    const showTips = ref((localStorage.showTips && localStorage.showTips === 'true') ?? true);
    const showTipsMinimal = ref((localStorage.showTipsMinimal && localStorage.showTipsMinimal === 'true') ?? false);
    const showTipsMinimalAmount = ref(Number(localStorage.showTipsMinimalAmount || 50));
    const showResubs = ref((localStorage.showResubs && localStorage.showResubs === 'true') ?? true);
    const showResubsPrime = ref((localStorage.showResubsPrime && localStorage.showResubsPrime === 'true') ?? true);
    const showResubsTier1 = ref((localStorage.showResubsTier1 && localStorage.showResubsTier1 === 'true') ?? true);
    const showResubsTier2 = ref((localStorage.showResubsTier2 && localStorage.showResubsTier2 === 'true') ?? true);
    const showResubsTier3 = ref((localStorage.showResubsTier3 && localStorage.showResubsTier3 === 'true') ?? true);
    const showSubs = ref((localStorage.showSubs && localStorage.showSubs === 'true') ?? true);
    const showSubsPrime = ref((localStorage.showSubsPrime && localStorage.showSubsPrime === 'true') ?? true);
    const showSubsTier1 = ref((localStorage.showSubsTier1 && localStorage.showSubsTier1 === 'true') ?? true);
    const showSubsTier2 = ref((localStorage.showSubsTier2 && localStorage.showSubsTier2 === 'true') ?? true);
    const showSubsTier3 = ref((localStorage.showSubsTier3 && localStorage.showSubsTier3 === 'true') ?? true);
    const showResubsMinimal = ref((localStorage.showResubsMinimal && localStorage.showResubsMinimal === 'true') ?? false);
    const showResubsMinimalAmount = ref(Number(localStorage.showResubsMinimalAmount || 50));
    const showHosts = ref((localStorage.showHosts && localStorage.showHosts === 'true') ?? true);
    const showBits = ref((localStorage.showBits && localStorage.showBits === 'true') ?? true);
    const showRaids = ref((localStorage.showRaids && localStorage.showRaids === 'true') ?? true);
    const showSubGifts = ref((localStorage.showSubGifts && localStorage.showSubGifts === 'true') ?? true);
    const showSubCommunityGifts = ref((localStorage.showSubCommunityGifts && localStorage.showSubCommunityGifts === 'true') ?? true);
    watch([
      showFollows, showHosts, showBits, showRaids,
      showTips, showTipsMinimal, showTipsMinimalAmount,
      showResubs, showResubsPrime, showResubsTier1, showResubsTier2, showResubsTier3, showResubsMinimal, showResubsMinimalAmount,
      showSubs, showSubsPrime, showSubsTier1, showSubsTier2, showSubsTier3, showRedeems, showSubGifts, showSubCommunityGifts,
    ], (val) => {
      localStorage.showFollows = String(val[0]);
      localStorage.showHosts = String(val[1]);
      localStorage.showBits = String(val[2]);
      localStorage.showRaids = String(val[3]);
      localStorage.showTips = String(val[4]);
      localStorage.showTipsMinimal = String(val[5]);
      localStorage.showTipsMinimalAmount = String(val[6]);
      localStorage.showResubs = String(val[7]);
      localStorage.showResubsPrime = String(val[8]);
      localStorage.showResubsTier1 = String(val[9]);
      localStorage.showResubsTier2 = String(val[10]);
      localStorage.showResubsTier3 = String(val[11]);
      localStorage.showResubsMinimal = String(val[12]);
      localStorage.showResubsMinimalAmount = String(val[13]);
      localStorage.showSubs = String(val[14]);
      localStorage.showSubsPrime = String(val[15]);
      localStorage.showSubsTier1 = String(val[16]);
      localStorage.showSubsTier2 = String(val[17]);
      localStorage.showSubsTier3 = String(val[18]);
      localStorage.showRedeems = String(val[19]);
      localStorage.showSubGifts = String(val[20]);
      localStorage.showSubCommunityGifts = String(val[21]);
    });

    function filter (event: EventListInterface & { sortAmount: number}) {
      const follow = showFollows.value && event.event === 'follow';
      const host = showHosts.value && event.event === 'host';
      const raid = showRaids.value && event.event === 'raid';
      const bit = showBits.value && event.event === 'cheer';
      const redeem = showRedeems.value && event.event === 'rewardredeem';

      const tip = showTips.value && event.event === 'tip';
      const tipMinimal = !showTipsMinimal.value || (showTipsMinimal.value && event.sortAmount >= showTipsMinimalAmount.value);

      const resub = showResubs.value && event.event === 'resub';
      const months = JSON.parse(event.values_json).subCumulativeMonths ?? 0;
      const tier = JSON.parse(event.values_json).tier ?? 1;
      const resubMinimal = !showResubsMinimal.value || (showResubsMinimal.value && months >= showResubsMinimalAmount.value);
      const resubPrime = showResubsPrime.value && tier === 'Prime';
      const resubTier1 = showResubsTier1.value && Number(tier) === 1;
      const resubTier2 = showResubsTier2.value && Number(tier) === 2;
      const resubTier3 = showResubsTier3.value && Number(tier) === 3;

      const sub = showSubs.value && event.event === 'sub';
      const subPrime = showSubsPrime.value && tier === 'Prime';
      const subTier1 = showSubsTier1.value && Number(tier) === 1;
      const subTier2 = showSubsTier2.value && Number(tier) === 2;
      const subTier3 = showSubsTier3.value && Number(tier) === 3;

      const subgift = showSubGifts.value && event.event === 'subgift';
      const subcommunitygift = showSubCommunityGifts.value && event.event === 'subcommunitygift';

      return follow
        || redeem
        || host
        || raid
        || (tip && tipMinimal)
        || bit
        || (resub && resubMinimal && (resubPrime || resubTier1 || resubTier2 || resubTier3))
        || (sub && (subPrime || subTier1 || subTier2 || subTier3))
        || subgift
        || subcommunitygift;
    }

    watch([areAlertsMuted, isTTSMuted, isSoundMuted], (val) => {
      saveMutation({ name: 'areAlertsMuted', value: val[0] });
      saveMutation({ name: 'isTTSMuted', value: val[1] });
      saveMutation({ name: 'isSoundMuted', value: val[2] });
    });

    function resendAlert (id: string) {
      console.log(`resendAlert => ${id}`);
      getSocket('/widgets/eventlist').emit('eventlist::resend', id);
    }

    function emitSkipAlertEvent () {
      console.log('Skipping current alert');
      getSocket('/widgets/eventlist').emit('skip');
    }

    function prepareMessage (event: any) {
      let t = translate(`eventlist-events.${event.event}`);

      const values = JSON.parse(event.values_json);
      const formattedAmount = Intl.NumberFormat(store.state.configuration.lang, { style: 'currency', currency: get(values, 'currency', 'USD') }).format(get(values, 'amount', '0'));
      t = t.replace('$formatted_amount', '<strong style="font-size: 1rem">' + formattedAmount + '</strong>');
      t = t.replace('$viewers', '<strong style="font-size: 1rem">' + get(values, 'viewers', '0') + '</strong>');
      t = t.replace('$tier', `${translate('tier')} <strong style="font-size: 1rem">${get(values, 'tier', 'n/a')}</strong>`);
      t = t.replace('$username', get(values, 'fromId', 'n/a'));
      t = t.replace('$subCumulativeMonthsName', get(values, 'subCumulativeMonthsName', 'months'));
      t = t.replace('$subCumulativeMonths', '<strong style="font-size: 1rem">' + get(values, 'subCumulativeMonths', '0') + '</strong>');
      t = t.replace('$subStreakName', get(values, 'subStreakName', 'months'));
      t = t.replace('$subStreak', '<strong style="font-size: 1rem">' + get(values, 'subStreak', '0') + '</strong>');
      t = t.replace('$bits', '<strong style="font-size: 1rem">' + get(values, 'bits', '0') + '</strong>');
      t = t.replace('$count', '<strong style="font-size: 1rem">' + get(values, 'count', '0') + '</strong>');
      t = t.replace('$titleOfReward', '<strong style="font-size: 1rem">' + get(values, 'titleOfReward', '') + '</strong>');

      let output = `<span style="font-size:0.7rem; font-weight: normal">${t}</span>`;
      if (values.song_url && values.song_title) {
        output += `<div style="font-size: 0.7rem"><strong>${translate('song-request')}:</strong> <a href="${values.song_url}">${values.song_title}</a></div>`;
      }
      return output;
    }

    function blockquote (event: any) {
      const values = JSON.parse(event.values_json);
      if (values.message) {
        return `${values.message.replace(/(\w{10})/g, '$1<wbr>')}`;
      } // will force new line for long texts

      return false;
    }

    function removeSelected () {
      // filter events
      const filteredEvents: typeof events.value = [];
      events.value.forEach((item) => {
        if (filter(item)) {
          filteredEvents.push(item);
        }
      });
      for (const idx of selected.value) {
        const id = filteredEvents[idx].id;
        if (id) {
          getSocket('/widgets/eventlist').emit('eventlist::removeById', id, () => {
            return true;
          });

          events.value.splice(events.value.findIndex(o => o.id === id), 1);
        }
      }
      selected.value = [];
    }

    onMounted(() => {
      getSocket('/widgets/eventlist').on('askForGet', () => getSocket('/widgets/eventlist').emit('eventlist::get', 100));
      getSocket('/widgets/eventlist').on('update', (values: any) => {
        isLoading.value = false;
        events.value = values;
      });
      getSocket('/widgets/eventlist').emit('eventlist::get', 100);
      setInterval(() => getSocket('/widgets/eventlist').emit('eventlist::get', 100), 60000);
    });

    return {
      /* libraries */
      translate,
      get,
      dayjs,

      /* functions */
      emitSkipAlertEvent,
      prepareMessage,
      blockquote,
      resendAlert,
      removeSelected,
      filter,

      /* refs */
      isTTSMuted,
      areAlertsMuted,
      isSoundMuted,
      events,
      isLoading,
      selected,
      menu,
      isPopout,

      /* filter refs */
      showFollows,
      showTips,
      showTipsMinimal,
      showTipsMinimalAmount,
      showHosts,
      showBits,
      showRaids,
      showResubs,
      showResubsPrime,
      showResubsTier1,
      showResubsTier2,
      showResubsTier3,
      showResubsMinimal,
      showResubsMinimalAmount,
      showSubs,
      showSubsPrime,
      showSubsTier1,
      showSubsTier2,
      showSubsTier3,
      showRedeems,
      showSubCommunityGifts,
      showSubGifts,
    };
  },
});
</script>
