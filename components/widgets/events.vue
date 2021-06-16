<template>
  <v-card id="5b90af97-ad95-4776-89e3-9a59c67510e4" width="100%" :loading="isLoading">
    <v-toolbar height="36" color="blue-grey darken-4" class="mb-1">
      <v-spacer />
      <v-btn
        v-if="selected.length > 0"
        color="red"
        icon
        height="36"
        width="36"
        @click="removeSelected"
      >
        <v-icon>{{ mdiDelete }}</v-icon> {{ selected.length }}
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
                <v-icon>{{ mdiFilterMenu }}</v-icon>
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
            <v-icon>{{ mdiSkipNext }}</v-icon>
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
              {{ mdiTextToSpeechOff }}
            </v-icon>
            <v-icon v-else>
              {{ mdiTextToSpeech }}
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
              {{ mdiVolumeMute }}
            </v-icon>
            <v-icon v-else>
              {{ mdiVolumeHigh }}
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
              {{ mdiBellCancel }}
            </v-icon>
            <v-icon v-else>
              {{ mdiBellRing }}
            </v-icon>
          </v-btn>
        </template>
        <span>{{ areAlertsMuted ? 'Alerts are disabled.' : 'Alerts are enabled!' }}</span>
      </v-tooltip>
    </v-toolbar>

    <v-list class="pa-0 ma-0" :height="!isPopout ? height : null" style="overflow: auto;">
      <v-list-item-group
        v-model="selected"
        multiple
      >
        <template v-for="(item, index) in events">
          <v-fade-transition :key="item.timestamp + item.username + item.type">
            <v-hover v-if="filter(item)" v-slot="{ hover }">
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>
                    <span class="text-h6">{{ item.username }}</span> <span v-html="prepareMessage(item)" />
                  </v-list-item-title>
                  <v-list-item-subtitle v-text="dayjs(item.timestamp).fromNow()" />

                  <v-row v-if="blockquote(item)" no-gutters class="pt-2">
                    <v-col cols="auto">
                      <v-icon color="accent" x-small style="transform: translateY(5px);">
                        {{ mdiFormatQuoteOpen }}
                      </v-icon>
                      {{ blockquote(item) }}
                      <v-icon color="accent" x-small style="transform: translateY(-5px);">
                        {{ mdiFormatQuoteClose }}
                      </v-icon>
                    </v-col>
                  </v-row>
                </v-list-item-content>

                <v-list-item-action>
                  <v-btn
                    v-if="hover"
                    icon
                    height="36"
                    width="36"
                    style="transform: translateX(5px);"
                    @click.stop="resendAlert(item.id)"
                  >
                    <v-icon>{{ mdiRefresh }}</v-icon>
                  </v-btn>
                  <template v-else>
                    <v-icon v-if="item.event === 'follow'" color="red lighten-1">
                      {{ mdiHeart }}
                    </v-icon>
                    <v-icon v-else-if="item.event === 'host'" color="orange lighten-1">
                      {{ mdiTelevision }}
                    </v-icon>
                    <v-icon v-else-if="item.event === 'raid'" color="lime lighten-1">
                      {{ mdiFencing }}
                    </v-icon>
                    <v-icon v-else-if="item.event === 'sub'" color="indigo lighten-1">
                      {{ mdiYoutubeSubscription }}
                    </v-icon>
                    <v-icon v-else-if="item.event === 'subgift'" color="pink lighten-1">
                      {{ mdiGift }}
                    </v-icon>
                    <v-icon v-else-if="item.event === 'subcommunitygift'" color="deep-orange lighten-1">
                      {{ mdiGiftOpen }}
                    </v-icon>
                    <v-icon v-else-if="item.event === 'resub'" color="deep-purple lighten-1">
                      {{ mdiAutorenew }}
                    </v-icon>
                    <v-icon v-else-if="item.event === 'cheer'" color="yellow lighten-1">
                      {{ mdiDiamond }}
                    </v-icon>
                    <v-icon v-else-if="item.event === 'tip'" color="green lighten-1">
                      {{ mdiCash }}
                    </v-icon>
                  </template>
                </v-list-item-action>
              </v-list-item>
            </v-hover>
          </v-fade-transition>

          <v-fade-transition :key="item.timestamp + item.username + item.type + '2'">
            <v-divider
              v-if="index < events.length - 1 && filter(item)"
            />
          </v-fade-transition>
        </template>
      </v-list-item-group>
    </v-list>
  </v-card>
</template>

<script lang="ts">
import {
  mdiAutorenew, mdiBellCancel, mdiBellRing, mdiCash, mdiDelete,
  mdiDiamond, mdiFencing, mdiFilterMenu, mdiFormatQuoteClose, mdiFormatQuoteOpen,
  mdiGift, mdiGiftOpen, mdiHeart, mdiRefresh,
  mdiSkipNext, mdiTelevision, mdiTextToSpeech, mdiTextToSpeechOff,
  mdiVolumeHigh, mdiVolumeMute, mdiYoutubeSubscription,
} from '@mdi/js';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  computed,
  defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';
import { get } from 'lodash-es';

import type { EventListInterface } from '~/.bot/src/bot/database/entity/eventList';
import api from '~/functions/api';

export default defineComponent({
  setup (_, ctx) {
    const areAlertsMuted = ref(false);
    const isTTSMuted = ref(false);
    const isSoundMuted = ref(false);
    const isLoading = ref(true);
    const height = ref(600);
    const events = ref([] as EventListInterface[]);
    const selected = ref([] as number[]);
    const menu = ref(false);
    const isPopout = computed(() => location.href.includes('popout'));

    const showFollows = ref((localStorage.showFollows && localStorage.showFollows === 'true') ?? true);
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
    watch([
      showFollows, showHosts, showBits, showRaids,
      showTips, showTipsMinimal, showTipsMinimalAmount,
      showResubs, showResubsPrime, showResubsTier1, showResubsTier2, showResubsTier3, showResubsMinimal, showResubsMinimalAmount,
      showSubs, showSubsPrime, showSubsTier1, showSubsTier2, showSubsTier3,
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
    });

    function filter (event: EventListInterface & { sortAmount: number}) {
      const follow = showFollows.value && event.event === 'follow';
      const host = showHosts.value && event.event === 'host';
      const raid = showRaids.value && event.event === 'raid';
      const bit = showBits.value && event.event === 'cheer';

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

      return follow
        || host
        || raid
        || (tip && tipMinimal)
        || bit
        || (resub && resubMinimal && (resubPrime || resubTier1 || resubTier2 || resubTier3))
        || (sub && (subPrime || subTier1 || subTier2 || subTier3));
    }

    watch([areAlertsMuted, isTTSMuted, isSoundMuted], (val) => {
      api.post(ctx.root.$axios, '/api/v1/registry/alerts/settings?name=areAlertsMuted', { value: val[0] });
      api.post(ctx.root.$axios, '/api/v1/registry/alerts/settings?name=isTTSMuted', { value: val[1] });
      api.post(ctx.root.$axios, '/api/v1/registry/alerts/settings?name=isSoundMuted', { value: val[2] });
    });

    function updateHeight () {
      // so. many. parentElement. to get proper offsetTop as children offset is 0
      const offsetTop = document.getElementById('5b90af97-ad95-4776-89e3-9a59c67510e4')?.parentElement?.parentElement?.parentElement?.parentElement?.offsetTop || 0;
      const offset = 90;
      const newHeight = window.innerHeight - offsetTop - offset;
      height.value = Math.max(newHeight, 500);
    }

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

      // change resub translate if not shared substreak
      if (event.event === 'resub' && !event.subStreakShareEnabled) {
        t = translate(`eventlist-events.resubWithoutStreak`);
      }

      const values = JSON.parse(event.values_json);
      const formattedAmount = Intl.NumberFormat(ctx.root.$store.state.configuration.lang, { style: 'currency', currency: get(values, 'currency', 'USD') }).format(get(values, 'amount', '0'));
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

      let output = `<span style="font-size:0.7rem; font-weight: normal">${t}</span>`;
      if (values.song_url && values.song_title) {
        output += `<div style="font-size: 0.7rem"><strong>${translate('song-request')}:</strong> <a href="${values.song_url}">${values.song_title}</a></div>`;
      }
      return output;
    }

    function blockquote (event: any) {
      const values = JSON.parse(event.values_json);
      if (values.message) {
        return `${values.message.replace(/(\w{10})/g, '$1<wbr>')} Lorem Ipsum dolor sit amet`;
      } // will force new line for long texts

      return false;
    }

    function removeSelected () {
      for (const idx of selected.value) {
        const event = events.value[idx];
        getSocket('/widgets/eventlist').emit('eventlist::removeById', event.id, () => {
          return true;
        });
        events.value.splice(idx, 1);
      }
      selected.value = [];
    }

    onMounted(() => {
      api.getOne<boolean>(ctx.root.$axios, '/api/v1/registry/alerts/settings?name=areAlertsMuted', '')
        .then(response => (areAlertsMuted.value = response.data));
      api.getOne<boolean>(ctx.root.$axios, '/api/v1/registry/alerts/settings?name=isTTSMuted', '')
        .then(response => (isTTSMuted.value = response.data));
      api.getOne<boolean>(ctx.root.$axios, '/api/v1/registry/alerts/settings?name=isSoundMuted', '')
        .then(response => (isSoundMuted.value = response.data));
      getSocket('/widgets/eventlist').on('askForGet', () => getSocket('/widgets/eventlist').emit('eventlist::get', 100));
      getSocket('/widgets/eventlist').on('update', (values: any) => {
        isLoading.value = false;
        events.value = values;
      });
      getSocket('/widgets/eventlist').emit('eventlist::get', 100);
      setInterval(() => getSocket('/widgets/eventlist').emit('eventlist::get', 100), 60000);
      setInterval(() => updateHeight(), 100);
    });

    return {
      /* libraries */
      translate,
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
      height,
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

      /* icons */
      mdiSkipNext,
      mdiTextToSpeech,
      mdiTextToSpeechOff,
      mdiVolumeHigh,
      mdiVolumeMute,
      mdiBellRing,
      mdiBellCancel,
      mdiHeart,
      mdiFormatQuoteOpen,
      mdiFormatQuoteClose,
      mdiTelevision,
      mdiFencing,
      mdiYoutubeSubscription,
      mdiGift,
      mdiGiftOpen,
      mdiAutorenew,
      mdiDiamond,
      mdiCash,
      mdiFilterMenu,
      mdiDelete,
      mdiRefresh,
    };
  },
});
</script>
