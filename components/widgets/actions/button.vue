<template>
  <v-card
    :id="'quickaction-' + item.id"
    class="noselect"
    :color="item.options.color"
    elevation="2"
    width="100%"
  >
    <v-card-text v-ripple class="text-button pa-1 mb-1 text-center" style="font-size: 12px !important; display: block;" @click="!editing ? trigger($event) : dialog = true" :style="{ 'color': color }">
      <v-row v-if="item.type === 'command'" no-gutters>
        <v-slide-x-transition>
          <v-col v-if="editing" cols="auto" class="d-flex">
            <v-simple-checkbox v-model="clonedItem.selected" light v-if="color !== 'white'"/>
            <v-simple-checkbox v-model="clonedItem.selected" dark v-else/>
          </v-col>
        </v-slide-x-transition>
        <v-col class="text-truncate">
          {{ item.options.label }}
        </v-col>
      </v-row>
      <v-row v-if="item.type === 'customvariable'" no-gutters ripple>
        <v-slide-x-transition>
          <v-col v-if="editing" cols="auto" class="d-flex">
            <v-simple-checkbox v-model="clonedItem.selected" light v-if="color !== 'white'"/>
            <v-simple-checkbox v-model="clonedItem.selected" dark v-else/>
          </v-col>
        </v-slide-x-transition>
        <template v-if="customVariable && customVariable.type === 'eval'">
          <v-col class="text-truncate" style="line-height: normal;">
            <div>Eval cannot be used</div>
            <div class="font-weight-light">
              {{ clonedItem.options.customvariable }}
            </div>
          </v-col>
        </template>
        <template v-if="customVariable && customVariable.type === 'number'">
          <v-col v-if="!editing" cols="auto" class="d-flex">
            <v-icon class="minus" :color="color">
              {{ mdiMinus }}
            </v-icon>
          </v-col>
          <v-col class="text-truncate text" style="line-height: normal;">
            <div style="font-size: 1.2rem;">
              {{ customVariable.currentValue }}
            </div>
            <div class="font-weight-light">
              {{ clonedItem.options.customvariable }}
            </div>
          </v-col>

          <v-col v-if="!editing" cols="auto" class="d-flex">
            <v-icon class="plus" :color="color">
              {{ mdiPlus }}
            </v-icon>
          </v-col>
        </template>
        <template v-if="customVariable && customVariable.type === 'options'">
          <v-col class="text-truncate text" style="line-height: normal;">
            <div>
              {{ customVariable.currentValue }}
            </div>
            <div class="font-weight-light">
              {{ clonedItem.options.customvariable }}
            </div>
          </v-col>

          <v-col v-if="!editing" cols="auto" class="d-flex" :color="color">
            <v-icon>{{ mdiChevronDown }}</v-icon>
          </v-col>
        </template>
        <template v-if="customVariable && customVariable.type === 'text'">
          <v-col class="text-truncate text" style="line-height: normal;">
            <div>
              {{ customVariable.currentValue.length === 0 ? '&nbsp;' : customVariable.currentValue }}
            </div>
            <div class="font-weight-light">
              {{ clonedItem.options.customvariable }}
            </div>
          </v-col>

          <v-col v-if="!editing" cols="auto" class="d-flex" :color="color">
            <v-icon>{{ mdiPencil }}</v-icon>
          </v-col>
        </template>
      </v-row>
      <v-row v-if="item.type === 'randomizer' && randomizer" no-gutters ripple>
        <v-slide-x-transition>
          <v-col v-if="editing" cols="auto" class="d-flex">
            <v-simple-checkbox v-model="clonedItem.selected" light v-if="color !== 'white'"/>
            <v-simple-checkbox v-model="clonedItem.selected" dark v-else/>
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
          <v-icon class="plus" :color="color" v-if="!randomizerSpin">
            {{ mdiPlay }}
          </v-icon>
          <v-progress-circular v-else indeterminate size="20" />
        </v-col>
      </v-row>
    </v-card-text>

    <v-expand-transition>
      <div v-if="showMenu && customVariable && customVariable.type === 'text'">
        <v-text-field
          v-model="customVariable.currentValue"
          filled
          dense
          hide-details
          placeholder="Set your value"
          class="pa-0 ma-0"
          @input="debouncedTrigger($event, customVariable.currentValue)"
        />
      </div>
    </v-expand-transition>

    <v-expand-transition>
      <div v-if="showMenu && customVariable && customVariable.type === 'options'">
        <v-list dense>
          <v-list-item
            v-for="(item, index) in customVariable.usableOptions"
            :key="index"
          >
            <v-list-item-title @click="trigger($event, item)">
              {{ item }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </div>
    </v-expand-transition>

    <v-dialog
      v-model="dialog"
      persistent
      :fullscreen="$vuetify.breakpoint.mobile"
      transition="dialog-bottom-transition"
      max-width="600"
    >
      <v-card>
        <v-toolbar dense color="primary">
          <v-btn
            icon
            @click="dialog = false"
          >
            <v-icon>{{ mdiClose }}</v-icon>
          </v-btn>
          <span class="headline">Edit Action</span>
          <v-spacer />
          <v-btn
            small
            :text="!$vuetify.breakpoint.xs"
            :icon="$vuetify.breakpoint.xs"
            :loading="isSaving"
            @click="save"
          >
            <v-icon class="d-flex d-sm-none">{{ mdiFloppy }}</v-icon>
            <span class="d-none d-sm-flex">{{ translate('dialog.buttons.saveChanges.idle') }}</span>
          </v-btn>
        </v-toolbar>
        <v-card-text class="pa-0">
          <edit :key="timestamp" :item.sync="clonedItem" :valid.sync="valid" />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script lang="ts">
import {
  mdiChevronDown, mdiClose, mdiEye, mdiEyeOff, mdiFloppy, mdiMinus, mdiPencil, mdiPlay, mdiPlus,
} from '@mdi/js';
import {
  defineAsyncComponent,
  defineComponent, nextTick, onMounted, ref, useContext, watch,
} from '@nuxtjs/composition-api';
import { getContrastColor } from '@sogebot/ui-helpers/colors';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { cloneDeep, debounce } from 'lodash';

import { RandomizerInterface } from '../../../.bot/src/database/entity/randomizer';

import type { QuickActions } from '.bot/src/database/entity/dashboard';
import { VariableInterface } from '~/.bot/src/database/entity/variable';
import api from '~/functions/api';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';

type Props = {
  item: QuickActions.Item & { selected: boolean, temporary: boolean, show: boolean },
};

const rgbToHex = function (rgb: number | string) {
  let hex = Number(rgb).toString(16);
  if (hex.length < 2) {
    hex = '0' + hex;
  }
  return hex;
};

export default defineComponent({
  props:      { item: Object, editing: Boolean },
  components: { edit: defineAsyncComponent({ loader: () => import('~/components/widgets/actions/edit.vue') }) },
  setup (props: Props, ctx) {
    const { $axios } = useContext();
    const dialog = ref((props.item as any).temporary);
    const timestamp = ref(Date.now());
    const isSaving = ref(false);
    const clonedItem = ref(cloneDeep(props.item));
    const valid = ref(true);
    const showMenu = ref(false);
    const color = ref('white');
    const customVariable = ref(null as VariableInterface | null);
    const randomizer = ref(null as RandomizerInterface | null);
    const randomizerSpin = ref(false);

    const recalculateColor = () => {
      // get computed color
      const card = document.getElementById(`quickaction-${clonedItem.value.id}`) as HTMLElement;
      const bgColor = window.getComputedStyle(card, null).getPropertyValue('background-color');
      color.value = getContrastColor('#' + bgColor.replace('rgb(', '').replace(')', '').split(',').map(o => rgbToHex(o.trim())).join(''));
    };

    onMounted(() => {
      recalculateColor();

      // get value if customvariable
      if (clonedItem.value.type === 'customvariable') {
        api.get($axios, `/api/v1/quickaction/${clonedItem.value.id}`)
          .then((response) => {
            customVariable.value = (response.data as any).customvariable;
          });
        setInterval(() => {
          // don't refresh if in middle update
          if (!showMenu.value) {
            api.get($axios, `/api/v1/quickaction/${clonedItem.value.id}`)
              .then((response) => {
                customVariable.value = (response.data as any).customvariable;
              });
          }
        }, 5000);
      } else if (clonedItem.value.type === 'randomizer') {
        api.getOne<RandomizerInterface>($axios, `/api/v1/registry/randomizer`, clonedItem.value.options.randomizerId)
          .then((response) => {
            randomizer.value = response.data;
          });
        setInterval(() => {
          // don't refresh if in middle update
          if (!showMenu.value) {
            if (!randomizer.value) {
              return;
            }
            api.getOne<RandomizerInterface>($axios, `/api/v1/registry/randomizer`, clonedItem.value.options.randomizerId)
              .then((response) => {
                randomizer.value = response.data;
              });
          }
        }, 5000);
      }
    });

    watch(dialog, (val) => {
      if (val) {
        isSaving.value = false;
        valid.value = true;
        timestamp.value = Date.now();
        clonedItem.value = cloneDeep(props.item);
      }

      recalculateColor();
    });

    watch(() => clonedItem.value.selected, (val) => {
      ctx.emit('selected', val);
    });

    const save = () => {
      EventBus.$emit(`quickaction::${props.item.id}::valid`);
      nextTick(async () => {
        if (valid.value) {
          isSaving.value = true;
          try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { selected, temporary, show, ...item } = clonedItem.value;
            await api.post<QuickActions.Item>($axios, `/api/v1/quickaction`, item);
            dialog.value = false;
          } catch (e) {
            error(e);
          } finally {
            isSaving.value = false;
            ctx.emit('save');
          }
        }
      });
    };

    const debouncedTrigger = debounce((ev: MouseEvent, value?: string) => trigger(ev, value), 1000);
    const trigger = async (ev: MouseEvent, value?: string) => {
      if (randomizer.value) {
        // determinate which part of button is pushed
        const card = document.getElementById(`quickaction-${clonedItem.value.id}`) as HTMLElement;
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
      } else if (customVariable.value && (customVariable.value.type === 'options' || customVariable.value.type === 'text')) {
        if (typeof value === 'undefined') {
          showMenu.value = !showMenu.value;
        } else {
          console.log(`quickaction::trigger::${props.item.id}`);
          customVariable.value.currentValue = value;
          api.post($axios, `/api/v1/quickaction/${props.item.id}/trigger`, { value: value.trim() });
        }
      } else if (customVariable.value && customVariable.value.type === 'number') {
        // determinate which part of button is pushed
        const card = document.getElementById(`quickaction-${clonedItem.value.id}`) as HTMLElement;
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

        customVariable.value.currentValue = String(isDecrement
          ? Number(customVariable.value.currentValue) - 1
          : Number(customVariable.value.currentValue) + 1);
        console.log(`quickaction::trigger::${props.item.id}`);
        api.post($axios, `/api/v1/quickaction/${props.item.id}/trigger`, { value: isDecrement ? '-1' : '+1' });
      } else {
        console.log(`quickaction::trigger::${props.item.id}`);
        api.post($axios, `/api/v1/quickaction/${props.item.id}/trigger`);
      }
    };

    return {
      /* refs */
      clonedItem,
      color,
      dialog,
      isSaving,
      timestamp,
      valid,
      customVariable,
      showMenu,
      randomizer,
      randomizerSpin,

      // fncs
      save,
      trigger,
      debouncedTrigger,

      /* icons */
      mdiClose,
      mdiPlus,
      mdiMinus,
      mdiChevronDown,
      mdiPencil,
      mdiFloppy,
      mdiEye,
      mdiPlay,
      mdiEyeOff,

      // others
      translate,
    };
  },
});
</script>

<style>
.noselect {
  -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
     -khtml-user-select: none; /* Konqueror HTML */
       -moz-user-select: none; /* Old versions of Firefox */
        -ms-user-select: none; /* Internet Explorer/Edge */
            user-select: none; /* Non-prefixed version, currently
                                  supported by Chrome, Edge, Opera and Firefox */
}
</style>
