<template>
  <div>
    <v-form ref="form" v-model="valid" lazy-validation>
      <v-select
        v-model="clonedItem.options.countdownId"
        item-value="id"
        :items="overlaysCountdown"
        label="Countdown"
        :rules="rules.countdownId"
        :loading="isLoading"
      >
        <template #selection="data">
          <template v-if="data.item.groupId">
            <span>{{ data.item.groupId }}</span>
            <v-icon class="px-1">{{mdiChevronRight}}</v-icon>
          </template>
          <strong>{{ data.item.id }}</strong>
        </template>
        <template #item="data">
          <template v-if="data.item.groupId">
            <span>{{ data.item.groupId }}</span>
            <v-icon class="px-1">{{mdiChevronRight}}</v-icon>
          </template>
          <strong>{{ data.item.id }}</strong>
        </template>
      </v-select>
    </v-form>
  </div>
</template>

<script lang="ts">
import { mdiChevronRight } from '@mdi/js';
import {
  computed,
  defineComponent, onMounted, onUnmounted, ref, useContext, watch,
} from '@nuxtjs/composition-api';
import { cloneDeep, pick } from 'lodash';

import api from '../../../../functions/api';
import { error } from '../../../../functions/error';

import type {
  OverlayMapperCountdown, OverlayMapperGroup, OverlayMappers,
} from '.bot/src/database/entity/overlay';
import { EventBus } from '~/functions/event-bus';
import { required } from '~/functions/validators';

type Props = {
  item: OverlayMappers
};
export default defineComponent({
  props: { item: Object },
  setup (props: Props, ctx) {
    const clonedItem = ref(cloneDeep(props.item));
    const valid = ref(true);
    const form = ref(null);
    const isLoading = ref(true);
    const overlays = ref([] as OverlayMappers[]);
    const { $axios } = useContext();

    const overlaysCountdown = computed(() => {
      const countdowns: ((OverlayMapperGroup['opts']['items'][number] & {groupId: string}) | OverlayMapperCountdown)[] = overlays.value.filter((o): o is OverlayMapperCountdown => o.value === 'countdown');
      overlays.value.filter((o): o is OverlayMapperGroup => o.value === 'group').forEach((item) => {
        if (item.opts) {
          item.opts.items.filter(o => o.type === 'countdown').forEach(item2 => countdowns.push({
            groupId: item.id,
            ...item2,
          }));
        }
      });
      return countdowns;
    });

    onMounted(() => {
      api.get<OverlayMappers[]>($axios, '/api/v1/overlay')
        .then((response) => {
          overlays.value = response.data.data;
          isLoading.value = false;
        })
        .catch(err => error(err));

      EventBus.$on(`quickaction::${props.item.id}::valid`, () => {
        console.debug(`quickaction::${props.item.id}::valid`);
        (form.value as unknown as HTMLFormElement).validate();
      });
    });

    onUnmounted(() => {
      EventBus.$off(`quickaction::${props.item.id}::valid`);
    });

    const rules = { countdownId: [required] };

    watch(clonedItem, (val) => {
      ctx.emit('update:item', pick(val, ['id', 'userId', 'order', 'type', 'options.label', 'options.color', 'options.countdownId']));
    }, { deep: true });

    watch(valid, (val) => {
      ctx.emit('update:valid', val);
    });

    return {
      clonedItem, rules, valid, form, isLoading, overlaysCountdown, mdiChevronRight,
    };
  },
});
</script>
