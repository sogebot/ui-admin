<template>
  <v-card-text v-ripple class="text-button pa-1 mb-1 text-center" style="font-size: 12px !important; display: block;"
    :style="{ 'color': color }" @click="!editing ? trigger($event) : showDialog()">
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
import { useContext } from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import {
  defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';

import { RandomizerInterface } from '../../../../.bot/src/database/entity/randomizer';
import api from '../../../../functions/api';

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
    const { $axios } = useContext();
    const selected = ref(props.item.selected);
    watch(selected, (val) => {
      ctx.emit(val ? 'select' : 'unselect');
    });

    const randomizer = ref(null as RandomizerInterface | null);
    const randomizerSpin = ref(false);

    const showDialog = () => {
      ctx.emit('update:dialog', true);
    };

    onMounted(() => {
      api.getOne<RandomizerInterface>($axios, `/api/v1/registry/randomizer`, props.item.options.randomizerId)
        .then((response) => {
          randomizer.value = response.data;
        });
      setInterval(() => {
        // don't refresh if in middle update
        api.getOne<RandomizerInterface>($axios, `/api/v1/registry/randomizer`, props.item.options.randomizerId)
          .then((response) => {
            randomizer.value = response.data;
          });
      }, 5000);
    });

    const trigger = async (ev: MouseEvent) => {
      if (randomizer.value) {
        // determinate which part of button is pushed
        const card = document.getElementById(`quickaction-${props.item.id}`) as HTMLElement;
        const text = document.getElementsByClassName(`text`)[0] as HTMLElement;

        const getClassList = (el: Element) => {
          if (el.tagName === 'path') {
            return (Array.from(el.parentElement?.parentElement?.classList ?? []));
          } else {
            return (Array.from(el.parentElement?.classList ?? []));
          }
        };

        const mouseOffsetX = ev.offsetX;
        const isText = getClassList(ev.target as Element).includes('text');

        const isDecrement = !getClassList(ev.target as Element).includes('plus')
          && (getClassList(ev.target as Element).includes('minus') || mouseOffsetX < ((isText ? text.clientWidth : card.clientWidth) / 2));

        if (isDecrement) {
          randomizer.value.isShown = !randomizer.value.isShown;
          await api.post<void>($axios, '/api/v1/registry/randomizer/hideall');
          await api.patch<RandomizerInterface>($axios, '/api/v1/registry/randomizer/' + randomizer.value.id, { isShown: randomizer.value.isShown });
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
