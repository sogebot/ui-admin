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
  mdiClose, mdiExclamationThick, mdiPlus,
} from '@mdi/js';
import { getContrastColor } from '@sogebot/ui-helpers/colors';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineAsyncComponent,
  defineComponent, onMounted, ref,
} from '@vue/composition-api';
import { cloneDeep } from 'lodash-es';
import { v4 } from 'uuid';

import { AlertInterface } from '~/.bot/src/bot/database/entity/alert';
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

export default defineComponent({
  components: {
    font: defineAsyncComponent({ loader: () => import('~/components/form/expansion/font.vue') }),
    tts:  defineAsyncComponent({ loader: () => import('~/components/form/expansion/tts.vue') }),
  },
  setup (_, ctx) {
    const stepper = ref(1);

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
            item.value = response.data;
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

    const goBack = () => {
      ctx.root.$router.push({ path: '/registry/alerts' });
    };

    return {
      // refs
      isSaving,
      isLoading,
      form1,
      valid1,
      item,
      stepper,
      profanityFilterTypeOptions,

      // rules
      required,

      // functions
      save,
      goBack,

      // others
      translate,
      getContrastColor,

      // icons
      mdiClose,
      mdiPlus,
      mdiExclamationThick,
    };
  },
});
</script>
