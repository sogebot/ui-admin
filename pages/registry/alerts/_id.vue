<template>
  <v-card :loading="loading" class="fill-height">
    <portal to="navbar">
      <v-btn
        small
        :text="!$vuetify.breakpoint.xs"
        :icon="$vuetify.breakpoint.xs"
        :loading="saving"
        :disabled="!valid1 || loading"
        @click="save"
      >
        <v-icon class="d-flex d-sm-none">
          mdi-floppy
        </v-icon>
        <span class="d-none d-sm-flex">{{ translate('dialog.buttons.saveChanges.idle') }}</span>
      </v-btn>
    </portal>

    <v-fade-transition>
      <v-container v-if="!loading" fluid>
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

          <v-switch
            v-model="item.parry.enabled"
            class="mt-0 pt-0"
            :label="translate('registry.alerts.parryEnabled.name')"
          />

          <v-slider
            v-model.number="item.parry.delay"
            :label="translate('registry.alerts.parryDelay.name')"
            min="0"
            max="60000"
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
            <v-col v-for="lang of Object.keys(item.loadStandardProfanityList).filter(o => !o.startsWith('_'))" :key="lang" cols="auto">
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

        <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
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
                        style="text-align: left; justify-content: normal;"
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
                            mdi-content-copy
                          </v-icon>
                        </v-btn>
                        <v-btn icon small @click="removeVariant(event, idx)">
                          <v-icon color="red">
                            mdi-delete-forever
                          </v-icon>
                        </v-btn>
                      </v-tab>
                    </template>

                    <v-btn color="success" class="my-1" @click="newAlert(event)">
                      <v-icon>mdi-plus</v-icon>
                    </v-btn>
                  </v-tabs>
                </v-col>
                <v-col>
                  <v-tabs-items v-model="variantTabs[event]">
                    <v-tab-item v-for="alert of item[event]" :key="'event-tab-items-content-' + alert.id">
                      <formEdit
                        :value="alert"
                        :parent="item"
                        :event="event"
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

    <v-overlay v-if="loading">
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
  defineAsyncComponent,
  defineComponent, onMounted, ref, useRoute, useRouter, useStore, watch,
} from '@nuxtjs/composition-api';
import { getContrastColor } from '@sogebot/ui-helpers/colors';
import translate from '@sogebot/ui-helpers/translate';
import {
  useMutation, useQuery, useResult,
} from '@vue/apollo-composable';
import { cloneDeep } from 'lodash';
import { v4 } from 'uuid';

import { getBase64FromUrl } from '../../../functions/getBase64FromURL';

import { AlertInterface } from '~/.bot/src/database/entity/alert';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { required } from '~/functions/validators';
import GET_ONE from '~/queries/alert/getOne.gql';
import SAVE from '~/queries/alert/save.gql';
import UPLOAD from '~/queries/alert/upload.gql';

const emptyItem: AlertInterface = {
  id:                  v4(),
  updatedAt:           Date.now(),
  name:                '',
  alertDelayInMs:      0,
  profanityFilterType: 'replace-with-asterisk',
  parry:               {
    enabled: false,
    delay:   0,
  },
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
    formEdit: defineAsyncComponent({
      loader: () => import('~/components/registry/alerts/form.vue'),
    }),
    font: defineAsyncComponent({
      loader: () => import('~/components/form/expansion/font.vue'),
    }),
    tts: defineAsyncComponent({
      loader: () => import('~/components/form/expansion/tts.vue'),
    }),
  },
  setup () {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();

    const item = ref(cloneDeep(emptyItem) as AlertInterface);

    const { result, loading } = useQuery(GET_ONE, {
      id: route.value.params.id,
    });
    if (route.value.params.id !== 'new') {
      const cache = useResult<{ alerts: AlertInterface[] }, null, AlertInterface[]>(result, null, data => data.alerts);
      watch(cache, (value) => {
        if (!value) {
          return;
        }

        if (value.length === 0) {
          EventBus.$emit('snack', 'error', 'Data not found.');
          router.push({
            path: '/registry/alert',
          });
        } else {
          item.value = cloneDeep(value[0]);
          console.groupCollapsed(`alert::${route.value.params.id}`);
          console.log(value[0]);
          console.groupEnd();
        }
      }, {
        immediate: true, deep: true,
      });
    }
    const { mutate: uploadMutation, onError: onErrorUpload } = useMutation(UPLOAD);
    onErrorUpload(error);

    const { mutate: saveMutation, loading: saving, onDone: onDoneSave, onError: onErrorSave } = useMutation(SAVE);
    onDoneSave((res) => {
      router.push({
        params: {
          id: res.data.alertSave.id,
        },
      });
      EventBus.$emit('snack', 'success', 'Data saved.');
    });
    onErrorSave(error);

    const tabs = ref(null);
    const variantTabs = ref(
      supportedEvents.map(ev => ({
        [ev]: 0,
      })),
    );

    const form1 = ref(null);
    const valid1 = ref(true);

    const profanityFilterTypeOptions: { value: string; text: string }[] = [
      {
        value: 'disabled', text: translate('registry.alerts.profanityFilterType.disabled'),
      },
      {
        value: 'replace-with-asterisk', text: translate('registry.alerts.profanityFilterType.replace-with-asterisk'),
      },
      {
        value: 'replace-with-happy-words', text: translate('registry.alerts.profanityFilterType.replace-with-happy-words'),
      },
      {
        value: 'hide-messages', text: translate('registry.alerts.profanityFilterType.hide-messages'),
      },
      {
        value: 'disable-alerts', text: translate('registry.alerts.profanityFilterType.disable-alerts'),
      },
    ];

    onMounted(() => {
      store.commit('panel/back', '/registry/alerts');
    });

    const save = async () => {
      const isValid = await new Promise((resolve) => {
        let validation = true;
        EventBus.$emit('alert::validate', (_isValid: boolean) => {
          if (!_isValid) {
            validation = false;
          }
        });
        setTimeout(() => {
          resolve(validation);
        }, 100);
      });
      if (
        (form1.value as unknown as HTMLFormElement).validate() && isValid
      ) {
        console.log('Saving', item.value);
        saveMutation({
          data_json: JSON.stringify({
            ...item.value, id: item.value.id === 'new' ? v4() : item.value.id,
          }),
        });
      }
    };

    const newAlert = async (event: typeof supportedEvents[number]) => {
      const defaultAudio = '456968__funwithsound__success-resolution-video-game-fanfare-sound-effect.mp3';
      const defaultImage = 'cow01.gif';

      const [defaultAudioId, defaultImageId, defaultJs, defaultHtml] = await Promise.all([
        new Promise<string>((resolve) => {
          getBase64FromUrl('/_static/' + defaultAudio).then((data) => {
            uploadMutation({
              data,
            }).then((res) => {
              resolve(res?.data.alertMediaUpload);
            });
          });
        }),
        new Promise<string>((resolve) => {
          getBase64FromUrl('/_static/' + defaultImage).then((data) => {
            uploadMutation({
              data,
            }).then((res) => {
              resolve(res?.data.alertMediaUpload);
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
      const _default: any = {
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
          loop:       false,
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
            ttsTemplate:     '{message}',
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
            ttsTemplate:     '{message}',
            rewardId:        null,
          });
          break;
        case 'cmdredeems':
          item.value.cmdredeems.push({
            ..._default,
            // eslint-disable-next-line no-template-curly-in-string
            messageTemplate: '{name} was redeemed by {recipient} for x{amount}!',
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
            ttsTemplate:     '{message}',
            messageTemplate: '{name} just resubscribed! {amount} {monthsName}',
            message:         {
              allowEmotes: {
                twitch: true, ffz: true, bttv: true,
              },
              font: null,
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
              font: null,
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
          getBase64FromUrl(`/api/v2/registry/alerts/media/${mediaId}`).then((data) => {
            uploadMutation({
              id: mediaMap.get(mediaId), data,
            }).then(() => resolve());
          });
        });
      }

      (item.value as any)[event].push(newVariant as any);
    };

    return {
      // refs
      saving,
      loading,
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
      newAlert,
      removeVariant,
      duplicateVariant,

      // others
      translate,
      getContrastColor,
    };
  },
});
</script>
