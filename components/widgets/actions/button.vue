<template>
  <v-card
    v-if="item"
    :id="'quickaction-' + item.id"
    class="noselect"
    :color="item.options.color"
    elevation="2"
    width="100%"
  >
    <component
      :is="components[item.type]"
      :item="item"
      :dialog.sync="dialog"
      :color="color"
      :editing="editing"
      @select="emitSelect(true)"
      @unselect="emitSelect(false)"
    />

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
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <span class="headline">Edit Action</span>
          <v-spacer />
          <v-btn
            small
            :text="!$vuetify.breakpoint.xs"
            :icon="$vuetify.breakpoint.xs"
            :loading="saving"
            @click="save"
          >
            <v-icon class="d-flex d-sm-none">
              mdi-floppy
            </v-icon>
            <span class="d-none d-sm-flex">{{ translate('dialog.buttons.saveChanges.idle') }}</span>
          </v-btn>
        </v-toolbar>
        <v-card-text class="pa-0">
          <widgets-actions-edit :key="timestamp" :item.sync="clonedItem" :valid.sync="valid" />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import type { QuickActions } from '@entity/dashboard';
import { getContrastColor } from '@sogebot/ui-helpers/colors';
import translate from '@sogebot/ui-helpers/translate';
import gql from 'graphql-tag';
import { cloneDeep } from 'lodash';

import { EventBus } from '~/functions/event-bus';

type Props = {
  item: QuickActions.Item & { selected: boolean, temporary: boolean, show: boolean },
  editing: boolean,
};

const { $graphql } = useNuxtApp();
const props = defineProps<Props>();
const emit = defineEmits(['selected', 'save'])

const saving = ref(false);

const components = {
  command:          'widgets-actions-button-command',
  customvariable:   'widgets-actions-button-customvariable',
  randomizer:       'widgets-actions-button-randomizer',
  overlayCountdown: 'widgets-actions-button-overlay-countdown',
  overlayStopwatch: 'widgets-actions-button-overlay-stopwatch',
  overlayMarathon:  'widgets-actions-button-overlay-marathon',
};

const rgbToHex = function (rgb: number | string) {
  let hex = Number(rgb).toString(16);
  if (hex.length < 2) {
    hex = '0' + hex;
  }
  return hex;
};

const dialog = ref((props.item as any).temporary);
const timestamp = ref(Date.now());
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
    valid.value = true;
    timestamp.value = Date.now();
    clonedItem.value = cloneDeep(props.item);
  }

  recalculateColor();
});

const emitSelect = (val: boolean) => {
  emit('selected', val);
};

const save = () => {
  EventBus.$emit(`quickaction::${props.item.id}::valid`);
  nextTick(async () => {
    if (valid.value) {
      const { selected, temporary, show, ...item } = clonedItem.value;
      saving.value = true;
      await $graphql.default.request(gql`
      mutation quickActionSave($data: QuickActionInput!) {
        quickActionSave(data: $data) {
          ... on CommandItem { id }
          ... on CustomVariableItem { id }
          ... on RandomizerItem { id }
          ... on OverlayCountdownItem { id }
          ... on OverlayMarathonItem { id }
          ... on OverlayStopwatchItem { id }
        }
      }`, { data: { [item.type]: [item] } });
      emit('save');
      dialog.value = false;
      saving.value = false;
    }
  });
};
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
