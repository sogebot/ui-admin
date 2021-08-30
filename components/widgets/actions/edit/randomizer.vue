<template>
  <div>
    <v-form ref="form" v-model="valid" lazy-validation>
      <v-select item-value="id" v-model="clonedItem.options.randomizerId" :items="randomizers" label="Randomizer"
        :rules="rules.randomizerId" :loading="isLoading">
        <template v-slot:selection="data">
          <strong>{{data.item.name}}</strong>
          <small class="pl-1 font-italic">{{data.item.id}}</small>
        </template>
        <template v-slot:item="data">
          <strong>{{data.item.name}}</strong>
          <small class="pl-1 font-italic">{{data.item.id}}</small>
        </template>
      </v-select>
    </v-form>
  </div>
</template>

<script lang="ts">
import {
  defineComponent, onMounted, onUnmounted, ref, useContext, watch,
} from '@nuxtjs/composition-api';
import { cloneDeep } from 'lodash';

import { RandomizerInterface } from '../../../../.bot/src/database/entity/randomizer';
import api from '../../../../functions/api';
import { error } from '../../../../functions/error';

import type { RandomizerItem } from '.bot/src/database/entity/dashboard';
import { EventBus } from '~/functions/event-bus';
import { required } from '~/functions/validators';

type Props = {
  item: RandomizerItem
};
export default defineComponent({
  props: { item: Object },
  setup (props: Props, ctx) {
    const clonedItem = ref(cloneDeep(props.item));
    const valid = ref(true);
    const form = ref(null);
    const isLoading = ref(true);
    const randomizers = ref([] as RandomizerInterface[]);
    const { $axios } = useContext();

    onMounted(() => {
      api.get<RandomizerInterface[]>($axios, '/api/v1/registry/randomizer')
        .then((response) => {
          randomizers.value = response.data.data;
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

    const rules = { randomizerId: [required] };

    watch(clonedItem, (val) => {
      ctx.emit('update:item', val);
    }, { deep: true });

    watch(valid, (val) => {
      ctx.emit('update:valid', val);
    });

    return {
      clonedItem, rules, valid, form, isLoading, randomizers,
    };
  },
});
</script>
