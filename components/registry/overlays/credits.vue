<template>
  <v-expansion-panels>
    <v-expansion-panel>
      <slot />
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
                mdi-delete-forever
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
          v-model="options.show.gameThumbnail"
          :label="translate('overlays.credits.settings.cShowGameThumbnail')"
        />
        <v-switch
          v-model="options.show.follow"
          :label="translate('overlays.credits.settings.cShowFollowers')"
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
          max="100"
          step="1"
          :thumb-size="0"
          thumb-label="always"
          @input="timestampUpdate()"
        >
          <template #thumb-label="{ value }">
            <div style="transform: translateY(-8px);">
              {{ Number(value).toFixed(0) + '%' }}
            </div>
          </template>
        </v-slider>

        <v-select
          v-model="options.clips.period"
          :label="translate('overlays.credits.settings.cClipsPeriod')"
          :items="['stream', 'custom']"
          @input="timestampUpdate()"
        />

        <v-text-field
          v-model.number="options.clips.periodValue"
          type="number"
          :label="translate('overlays.credits.settings.cClipsCustomPeriodInDays')"
          :min="0"
          @blur="timestampUpdate()"
          @input="options.clips.periodValue = $event"
        />

        <v-text-field
          v-model.number="options.clips.numOfClips"
          type="number"
          :label="translate('overlays.credits.settings.cClipsNumOfClips')"
          :min="1"
          @blur="timestampUpdate()"
          @input="options.clips.numOfClips = $event"
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
                mdi-delete-forever
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
import {
  defineComponent, ref, watch,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';
import { isEqual } from 'lodash';

import { setDefaultOpts } from '~/../backend/src/helpers/overlaysDefaultValues';

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
      { value: 'mdiTwitter', text: 'Twitter' },
      { value: 'mdiMicrosoftWindows', text: 'Windows' },
      { value: 'mdiMicrosoftXbox', text: 'XBox' },
      { value: 'mdiYoutube', text: 'YouTube' },
    ];

    const options = ref(setDefaultOpts(props.value, 'credits'));

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
      timestampUpdate,
    };
  },
});
</script>
