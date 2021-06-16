<template>
  <v-card :loading="isLoading" class="fill-height">
    <v-toolbar dense color="dark" style="z-index: 999;">
      <v-btn icon @click="goBack">
        <v-icon>{{ mdiClose }}</v-icon>
      </v-btn>
      <span v-if="$route.params.id === 'new'" class="headline">New Item</span>
      <span v-else class="headline">Edit Item</span>
      <v-spacer />
      <v-btn text :loading="isSaving" :disabled="!valid1 || isLoading" @click="save">
        {{ translate('dialog.buttons.saveChanges.idle') }}
      </v-btn>
    </v-toolbar>

    <v-fade-transition>
      <v-container v-if="!isLoading" fluid>
        <v-form ref="form1" v-model="valid1" lazy-validation>
          <v-text-field
            v-model="item.name"
            :rules="[required]"
            :label="translate('registry.alerts.name.name')"
            :placeholder="translate('registry.alerts.name.placeholder')"
          />

          <v-slider
            v-model.number="item.alertDelayInMs"
            :label="translate('registry.alerts.alertDelayInMs.name')"
            min="0"
            max="30000"
            step="500"
            :thumb-size="0"
            thumb-label="always"
          >
            <template #thumb-label="{ value }">
              <div style="transform: translateY(-8px);">
                {{ value / 1000 }}s
              </div>
            </template>
          </v-slider>

          <v-select
            v-model="item.profanityFilterType"
            :items="profanityFilterTypeOptions"
            :label="translate('registry.alerts.profanityFilterType.name')"
          />
          <v-row class="pb-4">
            <v-col cols="auto">
              <label class="v-label theme--dark">
                {{ translate('registry.alerts.loadStandardProfanityList') }}
              </label>
            </v-col>
            <v-col v-for="lang of Object.keys(item.loadStandardProfanityList)" :key="lang" cols="auto">
              <v-checkbox
                v-model="item.loadStandardProfanityList[lang]"
                class="pa-0 ma-0"
                :label="lang"
                hide-details
              />
            </v-col>
          </v-row>

          <v-textarea
            v-model="item.customProfanityList"
            :label="translate('registry.alerts.customProfanityList.name')"
            :hint="translate('registry.alerts.customProfanityList.help')"
            persistent-hint
            rows="1"
            auto-grow
            placeholder="example, kitty, zebra, horse"
          />
        </v-form>

        <v-expansion-panels class="pt-4">
          <v-expansion-panel>
            <v-expansion-panel-header>
              {{ translate('registry.goals.fontSettings') }}
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <font v-model="item.font" />
            </v-expansion-panel-content>
          </v-expansion-panel>
          <v-expansion-panel>
            <v-expansion-panel-header>
              {{ translate('registry.alerts.message.setting') }}
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <font v-model="item.fontMessage" />
            </v-expansion-panel-content>
          </v-expansion-panel>
          <tts v-model="item.tts" />
        </v-expansion-panels>

        <v-container fluid>
          <v-tabs
            v-model="tabs"
            show-arrows="always"
            class="pt-2"
            center-active
          >
            <v-tab
              v-for="event in supportedEvents"
              :key="'event-tab-' + event"
            >
              <v-badge color="accent" :content="item[event].length" :value="item[event].length">
                {{ translate('registry.alerts.event.' + event) }}
              </v-badge>
            </v-tab>
          </v-tabs>
          <v-tabs-items v-model="tabs">
            <v-tab-item
              v-for="event in supportedEvents"
              :key="'event-tab-children-' + event"
            >
              <v-row>
                <v-col cols="auto">
                  <v-tabs
                    v-model="variantTabs[event]"
                    vertical
                  >
                    <template v-for="(alert, idx) of item[event]">
                      <v-tab
                        :key="'event-tab-items-' + alert.id"
                      >
                        <v-badge
                          :color="alert.enabled ? 'green': 'red'"
                          dot
                          inline
                          left
                        >
                          <div class="text-truncate" style="width: 200px; max-width: 200px;">
                            <template v-if="alert.title.length > 0">
                              {{ alert.title }}
                            </template>
                            <template v-else>
                              Variant {{ idx + 1 }}
                            </template>
                          </div>
                        </v-badge>
                        <v-spacer />
                        <v-btn icon class="ml-4" small @click="duplicateVariant(event, idx)">
                          <v-icon small color="white">
                            {{ mdiContentCopy }}
                          </v-icon>
                        </v-btn>
                        <v-btn icon small @click="removeVariant(event, idx)">
                          <v-icon color="red">
                            {{ mdiDelete }}
                          </v-icon>
                        </v-btn>
                      </v-tab>
                    </template>

                    <v-btn color="success" class="my-1" @click="newAlert(event)">
                      <v-icon>{{ mdiPlus }}</v-icon>
                    </v-btn>
                  </v-tabs>
                </v-col>
                <v-col>
                  <v-tabs-items v-model="variantTabs[event]">
                    <v-tab-item v-for="alert of item[event]" :key="'event-tab-items-content-' + alert.id">
                      <formEdit
                        :value="alert"
                        :parent="item"
                        @input="alert = $event"
                      />
                    </v-tab-item>
                  </v-tabs-items>
                </v-col>
              </v-row>
            </v-tab-item>
          </v-tabs-items>
        </v-container>
      </v-container>
    </v-fade-transition>

    <v-overlay v-if="isLoading">
      <v-row>
        <v-col class="text-center">
          <v-progress-circular indeterminate size="48" />
        </v-col>
      </v-row>
    </v-overlay>
  </v-card>
</template>

<script lang="ts">
import {
  mdiClose, mdiContentCopy, mdiDelete, mdiExclamationThick, mdiPlus,
} from '@mdi/js';
import { getContrastColor } from '@sogebot/ui-helpers/colors';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineAsyncComponent,
  defineComponent, onMounted, ref,
} from '@vue/composition-api';
import { cloneDeep } from 'lodash-es';
import { v4 } from 'uuid';

import {
  AlertInterface, AlertMediaInterface, CommonSettingsInterface,
} from '~/.bot/src/bot/database/entity/alert';
import api from '~/functions/api';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { required } from '~/functions/validators';

const emptyItem: AlertInterface = {
  id:                        v4(),
  updatedAt:                 Date.now(),
  name:                      '',
  alertDelayInMs:            0,
  profanityFilterType:       'replace-with-asterisk',
  loadStandardProfanityList: {
    cs: false,
    en: true,
    ru: false,
  },
  customProfanityList: '',
  tts:                 null,
  font:                {
    align:          'center',
    family:         'PT Sans',
    size:           24,
    borderPx:       1,
    borderColor:    '#000000',
    weight:         800,
    color:          '#ffffff',
    highlightcolor: '#00ff00',
    shadow:         [] as {
      shiftRight: number;
      shiftDown: number;
      blur: number;
      opacity: number;
      color: string;
    }[],
  },
  fontMessage: {
    align:       'left',
    family:      'PT Sans',
    size:        16,
    borderPx:    1,
    borderColor: '#000000',
    weight:      500,
    color:       '#ffffff',
    shadow:      [] as {
      shiftRight: number;
      shiftDown: number;
      blur: number;
      opacity: number;
      color: string;
    }[],
  },

  follows:           [],
  hosts:             [],
  raids:             [],
  cheers:            [],
  subs:              [],
  tips:              [],
  resubs:            [],
  subgifts:          [],
  subcommunitygifts: [],
  cmdredeems:        [],
  rewardredeems:     [],
};

const supportedEvents = ['follows', 'cheers', 'subs', 'resubs', 'subcommunitygifts', 'subgifts', 'tips', 'hosts', 'raids', 'cmdredeems', 'rewardredeems'] as const;

export default defineComponent({
  components: {
    formEdit: defineAsyncComponent({ loader: () => import('~/components/registry/alerts/form.vue') }),
    font:     defineAsyncComponent({ loader: () => import('~/components/form/expansion/font.vue') }),
    tts:      defineAsyncComponent({ loader: () => import('~/components/form/expansion/tts.vue') }),
  },
  setup (_, ctx) {
    const tabs = ref(null);
    const variantTabs = ref(
      supportedEvents.map(ev => ({ [ev]: 0 })),
    );

    const form1 = ref(null);
    const valid1 = ref(true);

    const isSaving = ref(false);
    const isLoading = ref(false);

    const item = ref(cloneDeep(emptyItem) as AlertInterface);

    const profanityFilterTypeOptions: { value: string; text: string }[] = [
      { value: 'disabled', text: translate('registry.alerts.profanityFilterType.disabled') },
      { value: 'replace-with-asterisk', text: translate('registry.alerts.profanityFilterType.replace-with-asterisk') },
      { value: 'replace-with-happy-words', text: translate('registry.alerts.profanityFilterType.replace-with-happy-words') },
      { value: 'hide-messages', text: translate('registry.alerts.profanityFilterType.hide-messages') },
      { value: 'disable-alerts', text: translate('registry.alerts.profanityFilterType.disable-alerts') },
    ];

    onMounted(() => {
      if (ctx.root.$route.params.id && ctx.root.$route.params.id !== 'new') {
        // load initial item
        isLoading.value = true;
        api.getOne<AlertInterface>(ctx.root.$axios, `/api/v1/registry/alerts`, String(ctx.root.$route.params.id) ?? '')
          .then((response) => {
            console.log(response.data);
            item.value = cloneDeep(response.data);
            isLoading.value = false;
          })
          .catch(() => {
            ctx.root.$router.push({ path: '/registry/alerts' });
            EventBus.$emit('snack', 'error', 'Data not found.');
          });
      }
    });

    const save = () => {
      if (
        (form1.value as unknown as HTMLFormElement).validate()
      ) {
        isSaving.value = true;
        api.patch(ctx.root.$axios, `/api/v1/registry/alerts/${item.value.id ?? v4()}`, item.value)
          .then((response) => {
            ctx.root.$router.push({ params: { id: response.id ?? '' } });
            EventBus.$emit('snack', 'success', 'Data saved.');
          })
          .catch((e) => {
            console.error(e.response.data);
            error(JSON.stringify(e.response.data));
          })
          .finally(() => (isSaving.value = false));
      }
    };

    const newAlert = async (event: typeof supportedEvents[number]) => {
      const defaultAudio = '456968__funwithsound__success-resolution-video-game-fanfare-sound-effect.mp3';
      const defaultImage = 'cow01.gif';

      const [defaultAudioId, defaultImageId, defaultJs, defaultHtml] = await Promise.all([
        new Promise<string>((resolve) => {
          fetch('/_static/' + defaultAudio)
            .then(response => response.blob())
            .then((data) => {
              const fd = new FormData();
              fd.append('file', data);
              api.post<FormData, AlertMediaInterface>(ctx.root.$axios, '/api/v1/registry/alerts/media/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                .then((data2) => {
                  resolve(data2.id);
                });
            });
        }),
        new Promise<string>((resolve) => {
          fetch('/_static/' + defaultImage)
            .then(response => response.blob())
            .then((data) => {
              const fd = new FormData();
              fd.append('file', data);
              api.post<FormData, AlertMediaInterface>(ctx.root.$axios, '/api/v1/registry/alerts/media/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                .then((data2) => {
                  resolve(data2.id);
                });
            });
        }),
        new Promise<string>((resolve) => {
          fetch((process.env.isNuxtDev ? 'http://localhost:20000/' : '/') + 'assets/alerts-js.txt')
            .then(response => response.text())
            .then(data => resolve(data));
        }),
        new Promise<string>((resolve) => {
          fetch((process.env.isNuxtDev ? 'http://localhost:20000/' : '/') + 'assets/alerts.txt')
            .then(response => response.text())
            .then(data => resolve(data));
        }),
      ]);
      const _default: CommonSettingsInterface = {
        messageTemplate: '',

        id:                   v4(),
        title:                '',
        filter:               null,
        variantAmount:        2,
        enabled:              true,
        layout:               '1',
        animationInDuration:  1000,
        animationOutDuration: 1000,
        animationIn:          'fadeIn',
        animationOut:         'fadeOut',
        animationText:        'wiggle',
        animationTextOptions: {
          speed:            'slow',
          characters:       '█▓░ </>',
          maxTimeToDecrypt: 4000,
        },
        imageId:      defaultImageId,
        imageOptions: {
          translateX: 0,
          translateY: 0,
          scale:      100,
        },
        soundId:            defaultAudioId,
        soundVolume:        20,
        alertDurationInMs:  10000,
        alertTextDelayInMs: 1500,
        enableAdvancedMode: false,
        advancedMode:       {
          html: defaultHtml,
          css:  '',
          js:   defaultJs,
        },
        tts: {
          enabled:         false,
          skipUrls:        true,
          keepAlertShown:  false,
          minAmountToPlay: 0,
        },
        font: null, // no override
      };

      switch (event) {
        case 'follows':
          item.value.follows.push({
            ..._default,
            messageTemplate: '{name} is now following!',
          });
          break;
        case 'cheers':
          item.value.cheers.push({
            ..._default,
            messageTemplate: '{name} cheered! x{amount}',
            message:         {
              minAmountToShow: 0,
              allowEmotes:     {
                twitch: true, ffz: true, bttv: true,
              },
              font: null,
            },
          });
          break;
        case 'subcommunitygifts':
          item.value.subcommunitygifts.push({
            ..._default,
            messageTemplate: '{name} just gifted {amount} subscribes!',
          });
          break;
        case 'subgifts':
          item.value.subgifts.push({
            ..._default,
            messageTemplate: '{name} just gifted sub to {recipient}! {amount} {monthsName}',
          });
          break;
        case 'rewardredeems':
          item.value.rewardredeems.push({
            ..._default,
            message: {
              minAmountToShow: 0,
              allowEmotes:     {
                twitch: true, ffz: true, bttv: true,
              },
              font: null,
            },
            messageTemplate: '{name} was redeemed by {recipient}!',
            rewardId:        null,
          });
          break;
        case 'cmdredeems':
          item.value.cmdredeems.push({
            ..._default,
            // eslint-disable-next-line no-template-curly-in-string
            messageTemplate: '{name} was redeemed by {recipient} for x${amount}!',
          });
          break;
        case 'subs':
          item.value.subs.push({
            ..._default,
            messageTemplate: '{name} just subscribed!',
          });
          break;
        case 'resubs':
          item.value.resubs.push({
            ..._default,
            messageTemplate: '{name} just resubscribed! {amount} {monthsName}',
            message:         {
              allowEmotes: {
                twitch: true, ffz: true, bttv: true,
              },
              font: {
                align:       'left',
                family:      'PT Sans',
                size:        12,
                borderPx:    2,
                borderColor: '#000000',
                weight:      500,
                color:       '#ffffff',
                shadow:      [],
              },
            },
          });
          break;
        case 'tips':
          item.value.tips.push({
            ..._default,
            messageTemplate: '{name} donated {amount}{currency}!',
            message:         {
              minAmountToShow: 0,
              allowEmotes:     {
                twitch: true, ffz: true, bttv: true,
              },
              font: {
                align:       'left',
                family:      'PT Sans',
                size:        12,
                borderPx:    2,
                borderColor: '#000000',
                weight:      500,
                color:       '#ffffff',
                shadow:      [],
              },
            },
          });
          break;
        case 'hosts':
          item.value.hosts.push({
            ..._default,
            messageTemplate: '{name} is now hosting my stream with {amount} viewers!',
          });
          break;
        case 'raids':
          item.value.raids.push({
            ..._default,
            messageTemplate: '{name} is raiding with a party of {amount} raiders!',
          });
          break;
      }
    };

    const goBack = () => {
      ctx.root.$router.push({ path: '/registry/alerts' });
    };

    const removeVariant = (event: keyof typeof supportedEvents, idx: number) => {
      (item.value as any)[event].splice(idx, 1);
    };

    const duplicateVariant = async (event: keyof typeof supportedEvents, idx: number) => {
      console.log('Duplicating variant');
      const newVariant = cloneDeep((item.value as any)[event][idx]);
      newVariant.id = v4();
      newVariant.title = '';

      // remap image and sound
      const mediaMap = new Map<string, string>();
      const soundId = newVariant.soundId;
      const imageId = newVariant.imageId;
      newVariant.soundId = v4();
      newVariant.imageId = v4();
      mediaMap.set(soundId, newVariant.soundId);
      mediaMap.set(imageId, newVariant.imageId);

      for (const mediaId of mediaMap.keys()) {
        await new Promise<void>((resolve) => {
        // we need to get data first -> then upload new
          fetch(`/api/v1/registry/alerts/media/${mediaId}`)
            .then(response => response.blob())
            .then(async (data) => {
              const fd = new FormData();
              fd.append('file', data);
              await api.put(ctx.root.$axios, `/api/v1/registry/alerts/media/${mediaMap.get(mediaId)}`, fd);
              resolve();
            });
        });
      }

      (item.value as any)[event].push(newVariant as any);
    };

    return {
      // refs
      isSaving,
      isLoading,
      form1,
      valid1,
      item,
      tabs,
      variantTabs,
      profanityFilterTypeOptions,
      supportedEvents,

      // rules
      required,

      // functions
      save,
      goBack,
      newAlert,
      removeVariant,
      duplicateVariant,

      // others
      translate,
      getContrastColor,

      // icons
      mdiClose,
      mdiPlus,
      mdiExclamationThick,
      mdiContentCopy,
      mdiDelete,
    };
  },
});
</script>
