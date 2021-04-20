<template>
  <v-select
    v-model="selectedReward"
    :label="capitalize(translate('event'))"
    :items="rewardItems"
    :hint="`${translate('events.myRewardIsNotListed')} ${translate('events.redeemAndClickRefreshToSeeReward')}`"
    persistent-hint
    :rules="rules.titleOfReward"
  >
    <template #append-outer>
      <v-btn @click="refreshRedeemedRewards()">
        <v-icon :class="{ spin: progress.redeemRewards === ButtonStates.progress }">
          {{ mdiSync }}
        </v-icon>
      </v-btn>
    </template>
  </v-select>
</template>

<script lang="ts">
import { mdiSync } from '@mdi/js';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { capitalize } from 'lodash-es';
import {
  computed,
  defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';

import { error } from '~/functions/error';

interface Props {
  value: string;
  rules: any;
}

export default defineComponent({
  props: {
    value: String,
    rules: Object,
  },
  setup (props: Props, ctx) {
    const redeemRewards = ref([] as string[]);
    const selectedReward = ref(props.value);
    const progress = ref({ redeemRewards: ButtonStates.progress } as { redeemRewards: number });

    const rewardItems = computed(() => {
      return [
        {
          text:     '-- Please select a custom reward --',
          value:    null,
          disabled: true,
        },
        ...redeemRewards.value.map(item => ({
          text:     item,
          value:    item,
          disabled: false,
        })),
      ];
    });

    const refreshRedeemedRewards = async () => {
      progress.value.redeemRewards = ButtonStates.progress;
      return new Promise<void>((resolve) => {
        getSocket('/core/events').emit('events::getRedeemedRewards', (err: string | null, redeems: string[]) => {
          if (err) {
            return error(err);
          }
          redeemRewards.value = redeems;
          setTimeout(() => (progress.value.redeemRewards = ButtonStates.idle), 1000);
          resolve();
        });
      });
    };

    onMounted(() => {
      refreshRedeemedRewards();
    });

    watch(selectedReward, (val) => {
      ctx.emit('update:value', val);
    });

    return {
      capitalize,
      progress,
      selectedReward,
      rewardItems,
      redeemRewards,

      refreshRedeemedRewards,

      translate,
      ButtonStates,
      mdiSync,
    };
  },
});
</script>

<style>
@-webkit-keyframes spin /* Safari and Chrome */ {
  from {
    -webkit-transform: rotate(0deg);
    -o-transform: rotate(0deg);
    transform: rotate(0deg);
  }

  to {
    -webkit-transform: rotate(360deg);
    -o-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}

@keyframes spin {
  from {
    -ms-transform: rotate(0deg);
    -moz-transform: rotate(0deg);
    -webkit-transform: rotate(0deg);
    -o-transform: rotate(0deg);
    transform: rotate(0deg);
  }

  to {
    -ms-transform: rotate(360deg);
    -moz-transform: rotate(360deg);
    -webkit-transform: rotate(360deg);
    -o-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}

.spin {
  -webkit-animation: spin 2s linear infinite;
  -moz-animation: spin 2s linear infinite;
  -ms-animation: spin 2s linear infinite;
  -o-animation: spin 2s linear infinite;
  animation: spin 2s linear infinite;
}
</style>
