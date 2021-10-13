<template>
  <v-card-text
    v-ripple
    class="text-button pa-1 mb-1 text-center"
    style="font-size: 12px !important; display: block;"
    :style="{ 'color': color }"
    @click="!editing ? trigger($event) : showDialog()"
  >
    <v-row v-if="randomizer" no-gutters ripple>
      <v-slide-x-transition>
        <v-col v-if="editing" cols="auto" class="d-flex">
          <v-simple-checkbox v-if="color !== 'white'" v-model="selected" light />
          <v-simple-checkbox v-else v-model="selected" dark />
        </v-col>
      </v-slide-x-transition>
      <v-col v-if="!editing" cols="auto" class="d-flex">
        <v-icon class="minus" :color="color">
          {{ randomizer.isShown ? mdiEye : mdiEyeOff }}
        </v-icon>
      </v-col>
      <v-col class="text py-1" style="line-height: normal;">
        <div style="font-size: 0.8rem;">
          {{ randomizer.name }}
        </div>
      </v-col>

      <v-col v-if="!editing" cols="auto" class="d-flex">
        <v-icon v-if="!randomizerSpin" class="plus" :color="color">
          {{ mdiPlay }}
        </v-icon>
        <v-progress-circular v-else indeterminate size="20" />
      </v-col>
    </v-row>
  </v-card-text>
</template>

<script lang="ts">
import {
  mdiEye, mdiEyeOff, mdiPlay,
} from '@mdi/js';
import { getSocket } from '@sogebot/ui-helpers/socket';
import {
  useMutation, useQuery, useResult,
} from '@vue/apollo-composable';
import {
  computed,
  defineComponent, ref, watch,
} from '@vue/composition-api';
import gql from 'graphql-tag';

import { RandomizerInterface } from '../../../../.bot/src/database/entity/randomizer';

import GET_ONE from '~/queries/randomizer/getOne.gql';

export default defineComponent({
  props: {
    item: Object, dialog: Boolean, color: String, editing: Boolean,
  },
  setup (props: {
    item: Record<string, any>,
    dialog: boolean,
    color: string,
    editing: boolean,
  }, ctx) {
    const selected = ref(props.item.selected);
    watch(selected, (val) => {
      ctx.emit(val ? 'select' : 'unselect');
    });

    const { result } = useQuery(GET_ONE, { id: props.item.options.randomizerId }, { pollInterval: 5000 });
    const cache = useResult<{ randomizers: RandomizerInterface[] }, null, RandomizerInterface[]>(result, null, data => data.randomizers);
    const randomizer = computed(() => {
      if (cache.value && cache.value.length > 0) {
        return cache.value[0];
      } else {
        return null;
      }
    });

    const { mutate: hideMutation } = useMutation(gql`mutation randomizerSetVisibility($id: String!, $value: Boolean!) { randomizerSetVisibility(id: $id, value: $value) }`, { refetchQueries: ['randomizerGetAll'] });

    const randomizerSpin = ref(false);

    const showDialog = () => {
      ctx.emit('update:dialog', true);
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
          hideMutation({
            id:    randomizer.value.id,
            value: !randomizer.value.isShown,
          }, { refetchQueries: ['randomizerGetOne'] });
        } else {
          randomizerSpin.value = true;
          getSocket('/registries/randomizer').emit('randomizer::startSpin', () => {
            return true;
          });
          setTimeout(() => {
            randomizerSpin.value = false;
          }, 5000);
        }
      }
    };

    return {
      // refs
      randomizer,
      randomizerSpin,
      selected,

      // functions
      trigger,
      showDialog,

      // icons
      mdiEye,
      mdiEyeOff,
      mdiPlay,
    };
  },
});
</script>
