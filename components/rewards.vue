<template>
  <v-select
    v-model="selectedReward"
    :outlined="outlined"
    :label="capitalize(translate('event'))"
    :items="rewardItems"
    :hint="`${translate('events.myRewardIsNotListed')} ${translate('events.redeemAndClickRefreshToSeeReward')}`"
    persistent-hint
    :rules="[required]"
  >
    <template #append-outer>
      <v-btn class="fill-height" @click="refreshRedeemedRewards()">
        <v-icon :class="{ spin: progress.redeemRewards === ButtonStates.progress }">
          mdi-sync
        </v-icon>
      </v-btn>
    </template>
  </v-select>
</template>

<script lang="ts">
import {
  computed,
  defineComponent, onMounted, ref, watch,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { capitalize } from 'lodash';

import { error } from '~/functions/error';
import { required } from '~/functions/validators';

interface Props {
  value: string;
  outlined: boolean;
}

export default defineComponent({
  props: {
    value:    String,
    outlined: Boolean,
  },
  setup (props: Props, ctx) {
    const redeemRewards = ref([] as string[]);
    const selectedReward = ref(props.value);
    const progress = ref({
      redeemRewards: ButtonStates.progress,
    } as { redeemRewards: number });

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

    const refreshRedeemedRewards = () => {
      progress.value.redeemRewards = ButtonStates.progress;
      return new Promise<void>((resolve) => {
        getSocket('/core/events').emit('events::getRedeemedRewards', (err, redeems: string[]) => {
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
      ctx.emit('input', val);
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
      required,
    };
  },
});
</script>
