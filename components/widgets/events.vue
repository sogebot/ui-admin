<template>
  <v-card ref="eventsRef" width="100%" class="mb-2" :loading="isLoading">
    <v-toolbar height="36" color="blue-grey darken-4" class="mb-1">
      <v-toolbar-title v-if="isPopout" class="text-button">
        {{ translate('widget-title-eventlist') }}
      </v-toolbar-title>
      <v-spacer />

      <v-btn v-if="selected.length > 0" color="red" icon @click="removeSelected">
        <v-icon>{{ mdiDelete }}</v-icon> {{ selected.length }}
      </v-btn>

      <v-tooltip v-if="!isPopout" bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            icon
            v-bind="attrs"
            href="#/popout/events"
            target="_blank"
            @click="emitSkipAlertEvent()"
            v-on="on"
          >
            <v-icon>{{ mdiOpenInNew }}</v-icon>
          </v-btn>
        </template>
        <span>Popout</span>
      </v-tooltip>

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
                    <v-checkbox label="Follows" class="pa-0 ma-0" hide-details />
                    <v-checkbox label="Tips" class="pa-0 ma-0" hide-details />
                    <v-checkbox label="Hosts" class="pa-0 ma-0" hide-details />
                    <v-checkbox label="Bits" class="pa-0 ma-0" hide-details />
                    <v-checkbox label="Raids" class="pa-0 ma-0" hide-details />
                  </v-col>
                  <v-col>
                    <v-checkbox label="Subs" class="pa-0 ma-0" hide-details />
                    <v-divider class="pa-1 ma-1" />
                    <v-checkbox label="Prime" class="pa-0 ma-0 pl-2" hide-details />
                    <v-checkbox label="Tier 1" class="pa-0 ma-0 pl-2" hide-details />
                    <v-checkbox label="Tier 2" class="pa-0 ma-0 pl-2" hide-details />
                    <v-checkbox label="Tier 3" class="pa-0 ma-0 pl-2" hide-details />
                  </v-col>
                </v-row>
                <v-row>
                  <v-col>
                    <v-checkbox label="Resubs" class="pa-0 ma-0" hide-details />
                    <v-divider class="pa-1 ma-1" />
                    <v-checkbox label="Prime" class="pa-0 ma-0 pl-2" hide-details />
                    <v-checkbox label="Tier 1" class="pa-0 ma-0 pl-2" hide-details />
                    <v-checkbox label="Tier 2" class="pa-0 ma-0 pl-2" hide-details />
                    <v-checkbox label="Tier 3" class="pa-0 ma-0 pl-2" hide-details />
                    <v-row no-gutters class="pl-2">
                      <v-col style="align-self: flex-end;">
                        <v-checkbox class="pa-0 ma-0" label="Minimum" />
                      </v-col>
                      <v-col>
                        <v-text-field type="number" single-line dense>
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
                    <v-checkbox label="Tips" class="pa-0 ma-0" hide-details />
                    <v-divider class="pa-1 ma-1" />
                    <v-row no-gutters class="pl-2">
                      <v-col style="align-self: flex-end;">
                        <v-checkbox class="pa-0 ma-0" label="Minimum" />
                      </v-col>
                      <v-col>
                        <v-text-field type="number" single-line dense>
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
                  text
                  @click="menu = false"
                >
                  Cancel
                </v-btn>
                <v-btn
                  color="primary"
                  text
                  @click="menu = false"
                >
                  Save
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
          <v-btn icon v-bind="attrs" :color="isTTSMuted ? 'grey' : 'white'" v-on="on" @click="isTTSMuted = !isTTSMuted">
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
          <v-btn icon v-bind="attrs" :color="isSoundMuted ? 'grey' : 'white'" v-on="on" @click="isSoundMuted = !isSoundMuted">
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
          <v-btn icon v-bind="attrs" :color="areAlertsMuted ? 'grey' : 'white'" v-on="on" @click="areAlertsMuted = !areAlertsMuted">
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
          <v-hover v-slot="{ hover }" :key="item.timestamp + item.username + item.type">
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>
                  {{ item.username }} <span v-html="prepareMessage(item)" />
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
                <v-btn v-if="hover" @click.stop="resendAlert(item.id)">
                  <v-icon>{{ mdiAutorenew }}</v-icon>
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

          <v-divider
            v-if="index < events.length - 1"
            :key="index"
          />
        </template>
      </v-list-item-group>
    </v-list>
  </v-card>
</template>

<script lang="ts">
import {
  mdiAutorenew, mdiBellCancel, mdiBellRing, mdiCash, mdiDelete,
  mdiDiamond, mdiFencing, mdiFilterMenu, mdiFormatQuoteClose, mdiFormatQuoteOpen,
  mdiGift, mdiGiftOpen, mdiHeart, mdiOpenInNew, mdiSkipNext,
  mdiTelevision, mdiTextToSpeech, mdiTextToSpeechOff, mdiVolumeHigh, mdiVolumeMute, mdiYoutubeSubscription,
} from '@mdi/js';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  computed,
  defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';
import { get } from 'lodash-es';

import { error } from '~/functions/error';

export default defineComponent({
  setup (_, ctx) {
    const areAlertsMuted = ref(false);
    const isTTSMuted = ref(false);
    const isSoundMuted = ref(false);
    const isLoading = ref(true);
    const height = ref(600);
    const events = ref([] as any[]);
    const selected = ref([] as any[]);
    const eventsRef = ref(null as any);
    const menu = ref(false);
    const isPopout = computed(() => location.href.includes('popout'));
    watch([areAlertsMuted, isTTSMuted, isSoundMuted], (val) => {
      getSocket('/registries/alerts').emit('alerts::areAlertsMuted', val[0]);
      getSocket('/registries/alerts').emit('alerts::areAlertsMuted', val[1]);
      getSocket('/registries/alerts').emit('alerts::areAlertsMuted', val[2]);
    });

    function updateHeight () {
      if (eventsRef.value === null) {
        setTimeout(() => updateHeight(), 100);
      } else {
        const offsetTop = eventsRef.value.$el.offsetTop;
        height.value = window.innerHeight - offsetTop - 45;
      }
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
      getSocket('/registries/alerts').emit('alerts::areAlertsMuted', null, (err: string, val: boolean) => {
        if (err) {
          return error(err);
        }
        areAlertsMuted.value = val;
      });
      getSocket('/registries/alerts').emit('alerts::isTTSMuted', null, (err: string, val: boolean) => {
        if (err) {
          return error(err);
        }
        isTTSMuted.value = val;
      });
      getSocket('/registries/alerts').emit('alerts::isSoundMuted', null, (err: string, val: boolean) => {
        if (err) {
          return error(err);
        }
        isSoundMuted.value = val;
      });
      getSocket('/widgets/eventlist').on('askForGet', () => getSocket('/widgets/eventlist').emit('eventlist::get', 100));
      getSocket('/widgets/eventlist').on('update', (values: any) => {
        isLoading.value = false;
        events.value = values;
      });
      getSocket('/widgets/eventlist').emit('eventlist::get', 100);
      setInterval(() => getSocket('/widgets/eventlist').emit('eventlist::get', 100), 60000);
      setTimeout(() => updateHeight(), 100);
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

      /* refs */
      isTTSMuted,
      areAlertsMuted,
      isSoundMuted,
      events,
      isLoading,
      height,
      eventsRef,
      selected,
      menu,
      isPopout,

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
      mdiOpenInNew,
      mdiDelete,
    };
  },
});
</script>
