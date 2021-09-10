<template>
  <v-card
    :id="'quickaction-' + item.id"
    class="noselect"
    :color="item.options.color"
    elevation="2"
    width="100%"
  >
    <component :is="item.type" :item="item" :dialog.sync="dialog" :color="color" :editing="editing" @select="emitSelect(true)" @unselect="emitSelect(false)"/>

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
            <v-icon class="d-flex d-sm-none">
              {{ mdiFloppy }}
            </v-icon>
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
import { mdiClose, mdiFloppy } from '@mdi/js';
import {
  defineAsyncComponent,
  defineComponent, nextTick, onMounted, ref, useContext, watch,
} from '@nuxtjs/composition-api';
import { getContrastColor } from '@sogebot/ui-helpers/colors';
import translate from '@sogebot/ui-helpers/translate';
import { cloneDeep } from 'lodash';

import type { QuickActions } from '.bot/src/database/entity/dashboard';
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
  components: {
    command:          defineAsyncComponent(() => import('./button/command.vue')),
    customvariable:   defineAsyncComponent(() => import('./button/customvariable.vue')),
    randomizer:       defineAsyncComponent(() => import('./button/randomizer.vue')),
    overlayCountdown: defineAsyncComponent(() => import('./button/overlayCountdown.vue')),
    edit:             defineAsyncComponent({ loader: () => import('~/components/widgets/actions/edit.vue') }),
  },
  setup (props: Props, ctx) {
    const { $axios } = useContext();
    const dialog = ref((props.item as any).temporary);
    const timestamp = ref(Date.now());
    const isSaving = ref(false);
    const clonedItem = ref(cloneDeep(props.item));
    const valid = ref(true);
    const color = ref('white');

    const recalculateColor = () => {
      // get computed color
      const card = document.getElementById(`quickaction-${clonedItem.value.id}`) as HTMLElement;
      const bgColor = window.getComputedStyle(card, null).getPropertyValue('background-color');
      color.value = getContrastColor('#' + bgColor.replace('rgb(', '').replace(')', '').split(',').map(o => rgbToHex(o.trim())).join(''));
    };

    onMounted(() => {
      recalculateColor();
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

    const emitSelect = (val: boolean) => {
      ctx.emit('selected', val);
    };

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

    return {
      /* refs */
      clonedItem,
      color,
      dialog,
      isSaving,
      timestamp,
      valid,

      // fncs
      save,
      emitSelect,

      /* icons */
      mdiClose,
      mdiFloppy,

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
