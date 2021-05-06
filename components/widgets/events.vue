<template>
  <v-card width="100%" class="mb-2" :loading="isLoading" ref="eventsRef">
    <v-toolbar height="36" color="blue-grey darken-4" class="mb-1">
      <v-toolbar-title class="text-button">
        {{ translate('widget-title-eventlist') }}
      </v-toolbar-title>

      <v-spacer />

      <v-btn icon title="Skip alert" @click="emitSkipAlertEvent()">
        <v-icon>{{ mdiSkipNext }}</v-icon>
      </v-btn>

      <v-btn icon :title="isTTSMuted ? 'TTS is disabled.' : 'TTS is enabled!'" :color="isTTSMuted ? 'grey' : 'white'" @click="isTTSMuted = !isTTSMuted">
        <v-icon v-if="isTTSMuted">
          {{ mdiTextToSpeechOff }}
        </v-icon>
        <v-icon v-else>
          {{ mdiTextToSpeech }}
        </v-icon>
      </v-btn>

      <v-btn icon :title="isSoundMuted ? 'Sound is muted.' : 'Sound is enabled!'" :color="isSoundMuted ? 'grey' : 'white'" @click="isSoundMuted = !isSoundMuted">
        <v-icon v-if="isSoundMuted">
          {{ mdiVolumeMute }}
        </v-icon>
        <v-icon v-else>
          {{ mdiVolumeHigh }}
        </v-icon>
      </v-btn>

      <v-btn icon :title="areAlertsMuted ? 'Alerts are disabled.' : 'Alerts are enabled!'" :color="areAlertsMuted ? 'grey' : 'white'" @click="areAlertsMuted = !areAlertsMuted">
        <v-icon v-if="areAlertsMuted">
          {{ mdiBellCancel }}
        </v-icon>
        <v-icon v-else>
          {{ mdiBellRing }}
        </v-icon>
      </v-btn>
    </v-toolbar>

    <v-list class="pa-0 ma-0" :height="height" style="overflow: auto;">
      <v-list-item-group
        multiple
      >
        <template v-for="(item, index) in events">
          <v-list-item :key="item.timestamp + item.username + item.type">
            <template #default="{ active }">
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
              </v-list-item-action>
            </template>
          </v-list-item>

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
  mdiBellCancel, mdiBellRing, mdiFencing, mdiFormatQuoteClose, mdiFormatQuoteOpen,
  mdiHeart, mdiSkipNext, mdiTelevision, mdiTextToSpeech, mdiTextToSpeechOff,
  mdiVolumeHigh, mdiVolumeMute, mdiYoutubeSubscription, mdiGift, mdiGiftOpen,
  mdiAutorenew, mdiDiamond, mdiCash,
} from '@mdi/js';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
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
    const eventsRef = ref(null as any);
    watch([areAlertsMuted, isTTSMuted, isSoundMuted], (val) => {
      getSocket('/registries/alerts').emit('alerts::areAlertsMuted', val[0]);
      getSocket('/registries/alerts').emit('alerts::areAlertsMuted', val[1]);
      getSocket('/registries/alerts').emit('alerts::areAlertsMuted', val[2]);
    });

    function updateWidth () {
      if (eventsRef.value === null) {
        setTimeout(() => updateWidth(), 100);
      } else {
        const offsetTop = eventsRef.value.$el.offsetTop;
        height.value = window.innerHeight - offsetTop - 45;
      }
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
      setTimeout(() => updateWidth(), 100);
    });

    return {
      /* libraries */
      translate,
      dayjs,

      /* functions */
      emitSkipAlertEvent,
      prepareMessage,
      blockquote,

      /* refs */
      isTTSMuted,
      areAlertsMuted,
      isSoundMuted,
      events,
      isLoading,
      height,
      eventsRef,

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
    };
  },
});
</script>
