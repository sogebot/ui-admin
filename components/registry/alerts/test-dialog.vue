<template>
  <v-dialog
    v-model="dialog"
    width="600"
  >
    <template #activator="{ on, attrs }">
      <v-btn
        v-bind="attrs"
        v-on="on"
      >
        Tester
      </v-btn>
    </template>

    <v-card>
      <v-card-text>
        <v-row class="py-1 pb-4">
          <v-col>
            <v-autocomplete
              v-model="event"
              :items="eventItems"
              hide-details
              :label="translate('registry.alerts.testDlg.event')"
            />
          </v-col>
        </v-row>

        <v-divider class="py-2" />

        <v-row v-if="event !== 'rewardredeem'" class="py-1">
          <v-col cols="auto" align-self="center">
            <v-btn icon :color="isUsernameRandomized ? 'success' : 'error'" @click="isUsernameRandomized = !isUsernameRandomized">
              <v-icon>mdi-dice-multiple</v-icon>
            </v-btn>
          </v-col>
          <v-col>
            <v-text-field
              v-model="username"
              :label="event === 'custom' ? translate('registry.alerts.testDlg.command') : translate('registry.alerts.testDlg.username')"
              hide-details
              :disabled="isUsernameRandomized"
            />
          </v-col>
        </v-row>

        <v-row v-if="event === 'rewardredeem'" class="py-1">
          <v-col>
            <rewards
              v-model="rewardId"
              :state="null"
              @name="rewardName = $event"
            />
          </v-col>
        </v-row>

        <v-row v-if="haveRecipient" class="py-1">
          <v-col cols="auto" align-self="center">
            <v-btn icon :color="isRecipientRandomized ? 'success' : 'error'" @click="isRecipientRandomized = !isRecipientRandomized">
              <v-icon>mdi-dice-multiple</v-icon>
            </v-btn>
          </v-col>
          <v-col>
            <v-text-field
              v-model="recipient"
              :label="translate('registry.alerts.testDlg.recipient')"
              hide-details
              :disabled="isRecipientRandomized"
            />
          </v-col>
        </v-row>

        <v-row v-if="haveAmount" class="py-1">
          <v-col cols="auto" align-self="center">
            <v-btn icon :color="isAmountRandomized ? 'success' : 'error'" @click="isAmountRandomized = !isAmountRandomized">
              <v-icon>mdi-dice-multiple</v-icon>
            </v-btn>
          </v-col>
          <v-col>
            <v-text-field
              v-model.number="amount"
              :label="amountLabel"
              type="number"
              :disabled="isAmountRandomized"
              hide-details
            />
          </v-col>
          <v-col>
            <v-autocomplete
              v-if="event === 'tip'"
              v-model="currency"
              :disabled="isAmountRandomized"
              :items="['USD', 'AUD', 'BGN', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD', 'HRK', 'HUF', 'IDR', 'ILS', 'INR', 'ISK', 'JPY', 'KRW', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PLN', 'RON', 'RUB', 'SEK', 'SGD', 'THB', 'TRY', 'ZAR']"
              hide-details
            />
          </v-col>
        </v-row>

        <v-row v-if="haveMessage" class="py-1">
          <v-col cols="auto" align-self="center">
            <v-btn icon :color="isMessageRandomized ? 'success' : 'error'" @click="isMessageRandomized = !isMessageRandomized">
              <v-icon>mdi-dice-multiple</v-icon>
            </v-btn>
          </v-col>
          <v-col>
            <v-textarea
              v-model="message"
              :disabled="isMessageRandomized"
              hide-details
              :label="translate('registry.alerts.testDlg.message')"
              rows="5"
            />
          </v-col>
        </v-row>

        <v-row v-if="haveTier" class="py-1">
          <v-col cols="auto" align-self="center">
            <v-btn icon :color="isTierRandomized ? 'success' : 'error'" @click="isTierRandomized = !isTierRandomized">
              <v-icon>mdi-dice-multiple</v-icon>
            </v-btn>
          </v-col>
          <v-col>
            <v-select
              v-model="tier"
              :disabled="isTierRandomized"
              hide-details
              :label="translate('registry.alerts.testDlg.tier')"
              :items="tiers"
            />
          </v-col>
        </v-row>

        <v-row v-if="haveService" class="py-1">
          <v-col cols="auto" align-self="center">
            <v-btn icon :color="isServiceRandomized ? 'success' : 'error'" @click="isServiceRandomized = !isServiceRandomized">
              <v-icon>mdi-dice-multiple</v-icon>
            </v-btn>
          </v-col>
          <v-col>
            <v-select
              v-model="service"
              :disabled="isServiceRandomized"
              hide-details
              :label="translate('registry.alerts.testDlg.service')"
              :items="services"
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn
          text
          @click="dialog = false"
        >
          {{ translate('dialog.buttons.close') }}
        </v-btn>
        <v-btn
          color="success"
          @click="onSubmit"
        >
          Test
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import type { EmitData } from '@entity/alert';
import {
  computed, defineAsyncComponent, defineComponent, ref, useStore,
} from '@nuxtjs/composition-api';
import { shuffle } from '@sogebot/ui-helpers/array';
import { generateUsername } from '@sogebot/ui-helpers/generateUsername';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';

import { Alert } from '~/../backend/dest/database/entity/alert';

export default defineComponent({
  components: { rewards: defineAsyncComponent({ loader: () => import('~/components/rewards.vue') }) },
  setup () {
    const store = useStore<any>();
    const events: Alert['items'][number]['type'][] = ['follow', 'cheer', 'tip', 'sub', 'resub', 'subcommunitygift', 'subgift', 'raid', 'custom', 'rewardredeem', 'promo'];

    const dialog = ref(false);
    const event = ref('follow' as typeof events[number]);
    const username = ref('');
    const rewardId = ref(null as null | string);
    const rewardName = ref(null as null | string);
    const isUsernameRandomized = ref(true);

    const recipient = ref('');
    const isRecipientRandomized = ref(true);
    const haveRecipient = computed(() => {
      return ['rewardredeem', 'subgift', 'custom'].includes(event.value);
    });

    const message = ref('');
    const isMessageRandomized = ref(true);
    const haveMessage = computed(() => {
      return ['tip', 'cheer', 'resub', 'rewardredeem', 'promo'].includes(event.value);
    });

    const amount = ref(5);
    const isAmountRandomized = ref(true);
    const haveAmount = computed(() => {
      return amountLabel.value !== null;
    });
    const currency = ref(store.state.configuration.currency);
    const amountLabel = computed(() => {
      switch (event.value) {
        case 'raid':
          return translate('registry.alerts.testDlg.amountOfViewers');
        case 'cheer':
        case 'custom':
          return translate('registry.alerts.testDlg.amountOfBits');
        case 'tip':
          return translate('registry.alerts.testDlg.amountOftip');
        case 'subcommunitygift':
          return translate('registry.alerts.testDlg.amountOfGifts');
        case 'resub':
        case 'subgift':
          return translate('registry.alerts.testDlg.amountOfMonths');
        default:
          return null;
      }
    });

    const services = ['donatello', 'donationalerts', 'kofi', 'qiwi', 'streamelements', 'streamlabs', 'tiltify', 'tipeeestream'] as const;
    const service = ref('tiltify' as typeof services[number]);
    const isServiceRandomized = ref(true);
    const haveService = computed(() => {
      return ['tip'].includes(event.value);
    });

    const tiers = ['Prime', '1', '2', '3'] as const;
    const tier = ref('Prime' as typeof tiers[number]);
    const isTierRandomized = ref(true);
    const haveTier = computed(() => {
      return ['subs', 'resub'].includes(event.value);
    });

    const onSubmit = () => {
      const messages = [
        'Lorem ipsum dolor sit amet, https://www.google.com',
        'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Etiam dictum tincidunt diam. Aliquam erat volutpat. Mauris tincidunt sem sed arcu. Etiam sapien elit, consequat eget, tristique non, venenatis quis, ante. Praesent id justo in neque elementum ultrices. Integer pellentesque quam vel velit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Etiam commodo dui eget wisi. Cras pede libero, dapibus nec, pretium sit amet, tempor quis. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.',
        'Lorem ipsum dolor sit amet, consectetuer adipiscing elit.',
        'This is some testing message :)',
        'Lorem ipsum dolor sit amet',
        '',
      ];

      const emit: EmitData = {
        amount:   isAmountRandomized.value ? Math.floor(Math.random() * 1000) : amount.value,
        rewardId: rewardId.value,
        name:
          event.value === 'rewardredeem'
            ? rewardName.value || ''
            : (isUsernameRandomized.value ? generateUsername() : username.value),
        tier:       isTierRandomized.value ? tiers[shuffle([0, 1, 2, 3])[0]] : tier.value,
        service:    isServiceRandomized.value ? shuffle(services)[0] : service.value,
        recipient:  isRecipientRandomized.value ? generateUsername() : recipient.value,
        currency:   currency.value,
        message:    isMessageRandomized.value ? shuffle(messages)[0] : message.value,
        event:      event.value,
        monthsName: '', // will be added at server
      };
      console.log('Testing', emit);
      getSocket('/registries/alerts').emit('test', emit);
    };

    const eventItems = computed(() => {
      return events.map(o => ({ value: o, text: translate('registry.alerts.event.' + o) }));
    });

    return {
      dialog,
      event,
      events,
      eventItems,

      rewardId,
      rewardName,
      username,
      isUsernameRandomized,

      recipient,
      isRecipientRandomized,
      haveRecipient,

      amount,
      isAmountRandomized,
      haveAmount,
      amountLabel,
      currency,

      tier,
      tiers,
      haveTier,
      isTierRandomized,

      service,
      services,
      haveService,
      isServiceRandomized,

      message,
      isMessageRandomized,
      haveMessage,

      onSubmit,

      translate,
    };
  },
});
</script>
