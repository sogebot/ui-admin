<template>
  <v-card-text
    v-ripple
    class="text-button pa-1 mb-1 text-center"
    style="font-size: 12px !important; display: block;"
    :style="{ 'color': color }"
    @click="!editing ? trigger($event) : showDialog()"
  >
    <v-row v-if="randomizer" no-gutters ripple>
      <v-col v-if="!editing" cols="auto" class="d-flex">
        <v-icon class="minus" :color="color">
          {{ randomizer.isShown ? 'mdi-eye' : 'mdi-eye-off' }}
        </v-icon>
      </v-col>
      <v-col class="text py-1" style="line-height: normal;">
        <div style="font-size: 0.8rem;">
          {{ randomizer.name }}
        </div>
      </v-col>

      <v-col v-if="!editing" cols="auto" class="d-flex">
        <v-icon v-if="!randomizerSpin" class="plus" :color="color">
          mdi-play
        </v-icon>
        <v-progress-circular v-else indeterminate size="20" />
      </v-col>

      <v-slide-x-reverse-transition>
        <v-col v-if="editing" cols="auto" class="d-flex">
          <v-simple-checkbox v-if="color !== 'white'" v-model="selected" light />
          <v-simple-checkbox v-else v-model="selected" dark />
        </v-col>
      </v-slide-x-reverse-transition>
    </v-row>
  </v-card-text>
</template>

<script setup lang="ts">
import { RandomizerInterface } from '@entity/randomizer';
import { getSocket } from '@sogebot/ui-helpers/socket';
import gql from 'graphql-tag';

import GET_ONE from '~/queries/randomizer/getOne.gql';

const { $graphql } = useNuxtApp();
const props = defineProps<{
  item: Record<string, any>,
  dialog: boolean,
  color: string,
  editing: boolean,
}>();

const selected = ref(props.item.selected);
const emit = defineEmits(['select', 'unselect', 'update:dialog'])
watch(selected, (val) => {
  emit(val ? 'select' : 'unselect');
});

const cache = ref([] as RandomizerInterface[]);
const refetch = async () => {
  cache.value = (await $graphql.default.request(GET_ONE, { id: props.item.options.randomizerId })).randomizers;
  setTimeout(() => refetch(), 5000);
};
const randomizer = computed(() => {
  if (cache.value && cache.value.length > 0) {
    return cache.value[0];
  } else {
    return null;
  }
});

onMounted(() => {
  refetch();
});

const randomizerSpin = ref(false);

const showDialog = () => {
  emit('update:dialog', true);
};

const trigger = (ev: MouseEvent) => {
  if (randomizer.value) {
    // determinate which part of button is pushed
    const card = document.getElementById(`quickaction-${props.item.id}`) as HTMLElement;
    const text = document.getElementsByClassName(`text`)[0] as HTMLElement;

    const getClassList = (el: Element) => {
      if (el.tagName === 'path') {
        return (Array.from(el.parentElement?.parentElement?.classList ?? []));
      } if (el.tagName === 'SPAN') {
        return (Array.from(el.classList ?? []));
      } else {
        return (Array.from(el.parentElement?.classList ?? []));
      }
    };

    const mouseOffsetX = ev.offsetX;
    const isText = getClassList(ev.target as Element).includes('text');

    const isDecrement = !getClassList(ev.target as Element).includes('plus')
          && (getClassList(ev.target as Element).includes('minus') || mouseOffsetX < ((isText ? text.clientWidth : card.clientWidth) / 2));

    if (isDecrement) {
      $graphql.default.request(gql`mutation randomizerSetVisibility($id: String!, $value: Boolean!) { randomizerSetVisibility(id: $id, value: $value) }`, {
        id:    randomizer.value.id,
        value: !randomizer.value.isShown,
      });
    } else {
      randomizerSpin.value = true;
      getSocket('/registries/randomizer').emit('randomizer::startSpin');
      setTimeout(() => {
        randomizerSpin.value = false;
      }, 5000);
    }
  }
};
</script>
