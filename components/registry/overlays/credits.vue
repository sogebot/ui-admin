<template>
  <v-expansion-panels>
    <v-expansion-panel>
      <v-expansion-panel-header>Text</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-select
          v-model="options.speed"
          :label="translate('overlays.credits.settings.cCreditsSpeed')"
          :items="['very slow', 'slow', 'medium', 'fast', 'very fast']"
        />
        <v-text-field
          v-model="options.text.lastMessage"
          :label="translate('overlays.credits.settings.cTextLastMessage')"
          @input="options.text.lastMessage = $event"
        />
        <v-text-field
          v-model="options.text.lastSubMessage"
          :label="translate('overlays.credits.settings.cTextLastSubMessage')"
          @input="options.text.lastSubMessage = $event"
        />
        <v-text-field
          v-model="options.text.streamBy"
          :label="translate('overlays.credits.settings.cTextStreamBy')"
          @input="options.text.streamBy = $event"
        />
        <v-text-field
          v-model="options.text.follow"
          :label="translate('overlays.credits.settings.cTextFollow')"
          @input="options.text.follow = $event"
        />
        <v-text-field
          v-model="options.text.host"
          :label="translate('overlays.credits.settings.cTextHost')"
          @input="options.text.host = $event"
        />
        <v-text-field
          v-model="options.text.raid"
          :label="translate('overlays.credits.settings.cTextRaid')"
          @input="options.text.raid = $event"
        />
        <v-text-field
          v-model="options.text.cheer"
          :label="translate('overlays.credits.settings.cTextCheer')"
          @input="options.text.cheer = $event"
        />
        <v-text-field
          v-model="options.text.sub"
          :label="translate('overlays.credits.settings.cTextSub')"
          @input="options.text.sub = $event"
        />
        <v-text-field
          v-model="options.text.resub"
          :label="translate('overlays.credits.settings.cTextResub')"
          @input="options.text.resub = $event"
        />
        <v-text-field
          v-model="options.text.subgift"
          :label="translate('overlays.credits.settings.cTextSubgift')"
          @input="options.text.subgift = $event"
        />
        <v-text-field
          v-model="options.text.subcommunitygift"
          :label="translate('overlays.credits.settings.cTextSubcommunitygift')"
          @input="options.text.subcommunitygift = $event"
        />
        <v-text-field
          v-model="options.text.tip"
          :label="translate('overlays.credits.settings.cTextTip')"
          @input="options.text.tip = $event"
        />
      </v-expansion-panel-content>
    </v-expansion-panel>
    <v-expansion-panel>
      <v-expansion-panel-header>Custom texts</v-expansion-panel-header>
      <v-expansion-panel-content :key="timestamp">
        <v-row v-for="(ct, index) of options.customTexts" :key="index" no-gutters class="pa-0 ma-0">
          <v-col class="pa-1">
            <v-select
              v-model="ct.type"
              dense
              hide-details
              filled
              :items="customTextTypes"
              @input="timestampUpdate()"
            />
          </v-col>
          <v-col class="pa-1">
            <v-text-field
              v-model="ct.left"
              dense
              hide-details
              filled
              :disabled="['bigHeader', 'separator'].includes(ct.type)"
              @blur="timestampUpdate()"
            />
          </v-col>
          <v-col class="pa-1">
            <v-text-field
              v-model="ct.middle"
              dense
              hide-details
              filled
              :disabled="['separator'].includes(ct.type)"
              @blur="timestampUpdate()"
            />
          </v-col>
          <v-col class="pa-1">
            <v-text-field
              v-model="ct.right"
              dense
              hide-details
              filled
              :disabled="['bigHeader', 'separator'].includes(ct.type)"
              @blur="timestampUpdate()"
            />
          </v-col>
          <v-col cols="auto" align-self="center">
            <v-btn icon @click="options.customTexts.splice(index, 1); timestampUpdate()">
              <v-icon color="red">
                {{ mdiDelete }}
              </v-icon>
            </v-btn>
          </v-col>
        </v-row>
        <v-btn @click="options.customTexts.push({ type: 'bigHeader', left: '', middle: '', right:''}); timestampUpdate()">
          Add new line
        </v-btn>
      </v-expansion-panel-content>
    </v-expansion-panel>
    <v-expansion-panel>
      <v-expansion-panel-header>Show</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-switch
          v-model="options.show.follow"
          :label="translate('overlays.credits.settings.cShowFollowers')"
        />
        <v-switch
          v-model="options.show.host"
          :label="translate('overlays.credits.settings.cShowHosts')"
        />
        <v-switch
          v-model="options.show.raid"
          :label="translate('overlays.credits.settings.cShowRaids')"
        />
        <v-switch
          v-model="options.show.sub"
          :label="translate('overlays.credits.settings.cShowSubscribers')"
        />
        <v-switch
          v-model="options.show.subgift"
          :label="translate('overlays.credits.settings.cShowSubgifts')"
        />
        <v-switch
          v-model="options.show.subcommunitygift"
          :label="translate('overlays.credits.settings.cShowSubcommunitygifts')"
        />
        <v-switch
          v-model="options.show.resub"
          :label="translate('overlays.credits.settings.cShowResubs')"
        />
        <v-switch
          v-model="options.show.cheer"
          :label="translate('overlays.credits.settings.cShowCheers')"
        />
        <v-switch
          v-model="options.show.clips"
          :label="translate('overlays.credits.settings.cShowClips')"
        />
        <v-switch
          v-model="options.show.tip"
          :label="translate('overlays.credits.settings.cShowTips')"
        />
      </v-expansion-panel-content>
    </v-expansion-panel>
    <v-expansion-panel>
      <v-expansion-panel-header>Clips</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-switch
          v-model="options.clips.play"
          :label="translate('overlays.credits.settings.cClipsShouldPlay')"
          @click="timestampUpdate()"
        />
        <v-slider
          v-model.number="options.clips.volume"
          :label="translate('registry.alerts.volume')"
          min="0"
          @input="timestampUpdate()"
          max="100"
          step="1"
          :thumb-size="0"
          thumb-label="always"
        >
          <template #thumb-label="{ value }">
            <div style="transform: translateY(-8px);">
              {{ Number(value).toFixed(0) + '%' }}
            </div>
          </template>
        </v-slider>

        <v-select
          @input="timestampUpdate()"
          v-model="options.clips.period"
          :label="translate('overlays.credits.settings.cClipsPeriod')"
          :items="['stream', 'custom']"
        />

        <v-text-field
          type="number"
          @blur="timestampUpdate()"
          v-model.number="options.clips.periodValue"
          :label="translate('overlays.credits.settings.cClipsCustomPeriodInDays')"
          @input="options.clips.periodValue = $event"
          :min="0"
        />

        <v-text-field
          type="number"
          @blur="timestampUpdate()"
          v-model.number="options.clips.numOfClips"
          :label="translate('overlays.credits.settings.cClipsNumOfClips')"
          @input="options.clips.numOfClips = $event"
          :min="1"
        />
      </v-expansion-panel-content>
    </v-expansion-panel>
    <v-expansion-panel>
      <v-expansion-panel-header>Social</v-expansion-panel-header>
      <v-expansion-panel-content :key="timestamp">
        <v-row v-for="(ct, index) of options.social" :key="index" no-gutters class="pa-0 ma-0">
          <v-col class="pa-1">
            <v-select
              v-model="ct.type"
              dense
              hide-details
              filled
              :items="socialTypes"
              @input="timestampUpdate()"
            />
          </v-col>
          <v-col class="pa-1">
            <v-text-field
              v-model="ct.text"
              dense
              hide-details
              filled
              @blur="timestampUpdate()"
            />
          </v-col>
          <v-col cols="auto" align-self="center">
            <v-btn icon @click="options.social.splice(index, 1); timestampUpdate()">
              <v-icon color="red">
                {{ mdiDelete }}
              </v-icon>
            </v-btn>
          </v-col>
        </v-row>
        <v-btn @click="options.social.push({ type: 'mdiFacebook', text:'' }); timestampUpdate()">
          Add new line
        </v-btn>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import { mdiDelete } from '@mdi/js';
import {
  defineComponent, ref, watch,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';
import { defaultsDeep, isEqual } from 'lodash';

export default defineComponent({
  props: { value: [Object, Array] },
  setup (props: any, ctx) {
    const timestamp = ref(Date.now());
    const customTextTypes: { value: string, text: string }[] = [
      { value: 'bigHeader', text: 'Big Header' },
      { value: 'header', text: 'Header' },
      { value: 'text', text: 'Text' },
      { value: 'smallText', text: 'Small Text' },
      { value: 'separator', text: 'Separator' },
    ];
    const socialTypes: { value: string, text: string }[] = [
      { value: 'mdiDeviantart', text: 'DeviantArt' },
      { value: 'mdiDiscord', text: 'Discord' },
      { value: 'mdiFacebook', text: 'Facebook' },
      { value: 'mdiGithub', text: 'GitHub' },
      { value: 'mdiGoogle', text: 'Google' },
      { value: 'mdiInstagram', text: 'Instagram' },
      { value: 'mdiLinkedin', text: 'LinkedIn' },
      { value: 'mdiSonyPlaystation', text: 'Playstation' },
      { value: 'mdiPinterest', text: 'Pinterest' },
      { value: 'mdiReddit', text: 'Reddit' },
      { value: 'mdiSkype', text: 'Skype' },
      { value: 'mdiSnapchat', text: 'Snapchat' },
      { value: 'mdiSpotify', text: 'Spotify' },
      { value: 'mdiSteam', text: 'Steam' },
      { value: 'mdiTelegram', text: 'Telegram' },
      { value: 'mdiTwitter', text: 'Twitter' },
      { value: 'mdiVk', text: 'VK' },
      { value: 'mdiMicrosoftWindows', text: 'Windows' },
      { value: 'mdiMicrosoftXbox', text: 'XBox' },
      { value: 'mdiYoutube', text: 'YouTube' },
    ];

    const options = ref(
      defaultsDeep(props.value, {
        speed:       'medium',
        customTexts: [],
        social:      [],
        clips:       {
          play:        true,
          period:      'custom',
          periodValue: 31,
          numOfClips:  3,
          volume:      20,
        },
        text: {
          lastMessage:      'Thanks for watching',
          lastSubMessage:   '~ see you on the next stream ~',
          streamBy:         'Stream by',
          follow:           'Followed by',
          host:             'Hosted by',
          raid:             'Raided by',
          cheer:            'Cheered by',
          sub:              'Subscribed by',
          resub:            'Resubscribed by',
          subgift:          'Subgifts by',
          subcommunitygift: 'Community subgifts by',
          tip:              'Tips by',
        },
        show: {
          follow:           true,
          host:             true,
          raid:             true,
          sub:              true,
          subgift:          true,
          subcommunitygift: true,
          resub:            true,
          cheer:            true,
          clips:            true,
          tip:              true,
        },
      }));

    watch([options, timestamp], () => {
      if (!isEqual(props.value, options.value)) {
        ctx.emit('input', options.value);
      }
    }, { deep: true, immediate: true });

    const timestampUpdate = () => {
      setTimeout(() => {
        timestamp.value = Date.now();
      }, 100);
    };

    return {
      options,
      customTextTypes,
      socialTypes,
      translate,
      timestamp,
      mdiDelete,
      timestampUpdate,
    };
  },
});
</script>
