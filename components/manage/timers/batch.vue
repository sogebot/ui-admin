<template>
  <div>
    <v-menu v-model="menu" offset-y :close-on-click="false" min-width="400" :close-on-content-click="false"
      offset-overflow>
      <template #activator="{ on, attrs }">
        <v-btn v-bind="attrs" small v-on="on">
          Batch update
        </v-btn>
      </template>
      <v-card outlined>
        <v-card-text>
          <v-form v-model="valid" lazy-validation>
            <v-row no-gutters>
              <v-col cols="auto" align-self="center">
                <v-checkbox v-model="toggles" value="triggerEverySecond" />
              </v-col>
              <v-col>
                <v-text-field v-model="triggerEverySecond" :disabled="!toggles.includes('triggerEverySecond')"
                  type="number" :label="capitalize(translate('seconds'))" hide-details="auto" />
              </v-col>
            </v-row>
            <v-row no-gutters>
              <v-col cols="auto" align-self="center">
                <v-checkbox v-model="toggles" value="triggerEveryMessage" />
              </v-col>
              <v-col>
                <v-text-field v-model="triggerEveryMessage" :disabled="!toggles.includes('triggerEveryMessage')"
                  type="number" :label="capitalize(translate('messages'))" hide-details="auto" />
              </v-col>
            </v-row>
            <v-row no-gutters>
              <v-col cols="auto" align-self="center">
                <v-checkbox v-model="toggles" value="enabled" />
              </v-col>
              <v-col>
                <v-switch v-model="enabled" :disabled="!toggles.includes('enabled')" :label="translate('enabled')"
                  persistent-hint hide-details="auto" :hint="(enabled
                    ? 'Timer is enabled.'
                    : 'Timer is disabled.')" />
              </v-col>
            </v-row>
            <v-row no-gutters>
              <v-col cols="auto" align-self="center">
                <v-checkbox v-model="toggles" value="tickOffline" />
              </v-col>
              <v-col>
                <v-switch v-model="tickOffline" :disabled="!toggles.includes('tickOffline')"
                  :label="capitalize(translate('timers.dialog.tickOffline'))" persistent-hint hide-details="auto" :hint="(tickOffline
                    ? 'Timers will be ticking, when stream is offline.'
                    : 'Timers will be stopped, when stream is offline.')" />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />

          <v-btn text @click="menu = false">
            Cancel
          </v-btn>
          <v-btn color="primary" text :disabled="!valid" @click="save()">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup lang="ts">

import translate from '@sogebot/ui-helpers/translate';
import capitalize from 'lodash/capitalize';

const emit = defineEmits(['save']);

const menu = ref(false);
const valid = ref(true);

const toggles = ref([] as string[]);

watch(menu, (val) => {
  if (val) {
    toggles.value = [];
  }
});

const tickOffline = ref(true);
const enabled = ref(true);
const triggerEveryMessage = ref(0);
const triggerEverySecond = ref(0);

const save = () => {
  emit('save', {
    tickOffline: toggles.value.includes('tickOffline')
      ? tickOffline.value
      : undefined,
    isEnabled: toggles.value.includes('enabled')
      ? enabled.value
      : undefined,
    triggerEveryMessage: toggles.value.includes('triggerEveryMessage')
      ? triggerEveryMessage.value
      : undefined,
    triggerEverySecond: toggles.value.includes('triggerEverySecond')
      ? triggerEverySecond.value
      : undefined,
  });
  menu.value = false;
};
</script>
