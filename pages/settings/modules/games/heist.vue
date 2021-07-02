<template>
  <loading v-if="!settings" />
  <v-card v-else flat style="min-height: 100%;">
    <v-card-text>
      <v-form ref="form" v-model="valid">
        <template>
          <v-card-title class="pt-0">
            {{ translate('categories.options') }}
          </v-card-title>
          <revert-text-field
            v-model="settings.options.showMaxUsers"
            class="pt-3"
            type="number"
            min="1"
            :label="translate('games.heist.settings.showMaxUsers')"
            :rules="[required, minValue(1)]"
          />
          <revert-text-field
            v-model="settings.options.copsCooldownInMinutes"
            class="pt-3"
            type="number"
            min="1"
            :label="translate('games.heist.settings.copsCooldownInMinutes.title')"
            :rules="[required, minValue(1)]"
          >
            <template #append>
              {{ translate('games.heist.settings.copsCooldownInMinutes.help') }}
            </template>
          </revert-text-field>
          <revert-text-field
            v-model="settings.options.entryCooldownInSeconds"
            class="pt-3"
            type="number"
            min="1"
            :label="translate('games.heist.settings.entryCooldownInSeconds.title')"
            :rules="[required, minValue(1)]"
          >
            <template #append>
              {{ translate('games.heist.settings.entryCooldownInSeconds.help') }}
            </template>
          </revert-text-field>
        </template>
        <template>
          <v-card-title class="pt-0">
            {{ translate('categories.notifications') }}
          </v-card-title>
          <revert-text-field
            v-model="settings.notifications.started"
            class="pt-3"
            :label="translate('games.heist.settings.started')"
            :rules="[required]"
          />
          <revert-text-field
            v-model="settings.notifications.nextLevelMessage"
            class="pt-3"
            :label="translate('games.heist.settings.nextLevelMessage')"
            :rules="[required]"
          />
          <revert-text-field
            v-model="settings.notifications.maxLevelMessage"
            class="pt-3"
            :label="translate('games.heist.settings.maxLevelMessage')"
            :rules="[required]"
          />
          <revert-text-field
            v-model="settings.notifications.copsOnPatrol"
            class="pt-3"
            :label="translate('games.heist.settings.copsOnPatrol')"
            :rules="[required]"
          />
          <revert-text-field
            v-model="settings.notifications.copsCooldown"
            class="pt-3"
            :label="translate('games.heist.settings.copsCooldown')"
            :rules="[required]"
          />
        </template>
        <template>
          <v-card-title class="pt-0 pb-1">
            {{ translate('categories.levels') }}
          </v-card-title>
          <v-alert v-if="settings.levels.levelsValues[0].length === 0" text border="left" color="orange">
            {{ translate('games.heist.noLevelsFound') }}
          </v-alert>
          <template v-for="(level, idx) of settings.levels.levelsValues[0]">
            <v-sheet :key="idx" class="pa-2">
              <v-row>
                <v-col>
                  <v-text-field
                    v-model="level.name"
                    :label="translate('games.heist.name')"
                    :rules="[required]"
                  />
                  <v-text-field
                    v-model="level.winPercentage"
                    :label="translate('games.heist.winPercentage')"
                    type="number"
                    min="0"
                    max="100"
                    :rules="[required, minValue(0), maxValue(100)]"
                  />
                  <v-text-field
                    v-model="level.payoutMultiplier"
                    :label="translate('games.heist.payoutMultiplier')"
                    type="number"
                    min="1"
                    step="0.1"
                    :rules="[required, minValue(1)]"
                  />
                  <v-text-field
                    v-model="level.maxUsers"
                    :label="translate('games.heist.maxUsers')"
                    type="number"
                    min="1"
                    :rules="[required, minValue(1)]"
                  />
                </v-col>
                <v-col cols="auto">
                  <v-btn icon @click="removeLevel(idx)">
                    <v-icon>{{ mdiDelete }}</v-icon>
                  </v-btn>
                </v-col>
              </v-row>
            </v-sheet>
            <v-divider v-if="idx !== settings.levels.levelsValues[0].length - 1" :key="idx + 1000000" />
          </template>
          <v-btn block @click="addLevel">Add level</v-btn>
        </template>
        <template>
          <v-card-title class="pt-0 pb-1">
            {{ translate('categories.results') }}
          </v-card-title>
          <v-text-field
            v-model="settings.results.singleUserSuccess"
            :label="translate('games.heist.settings.singleUserSuccess')"
            :rules="[required]"
          />
          <v-text-field
            v-model="settings.results.singleUserFailed"
            :label="translate('games.heist.settings.singleUserFailed')"
            :rules="[required]"
          />
          <v-text-field
            v-model="settings.results.noUser"
            :label="translate('games.heist.settings.noUser')"
            :rules="[required]"
          />
          <v-alert v-if="settings.results.resultsValues[0].length === 0" text border="left" color="orange">
            {{ translate('games.heist.noResultsFound') }}
          </v-alert>
          <template v-for="(level, idx) of settings.results.resultsValues[0]">
            <v-sheet :key="idx + 3000000000" class="pa-2">
              <v-row>
                <v-col>
                  <v-text-field
                    v-model="level.message"
                    :label="translate('games.heist.message')"
                    :rules="[required]"
                  />
                  <v-text-field
                    v-model="level.percentage"
                    :label="translate('games.heist.percentage')"
                    type="number"
                    min="0"
                    max="100"
                    :rules="[required, minValue(0), maxValue(100)]"
                  />
                </v-col>
                <v-col cols="auto">
                  <v-btn icon @click="removeResult(idx)">
                    <v-icon>{{ mdiDelete }}</v-icon>
                  </v-btn>
                </v-col>
              </v-row>
            </v-sheet>
            <v-divider v-if="idx !== settings.results.resultsValues[0].length - 1" :key="idx + 2000000" />
          </template>
          <v-btn block @click="addResult">Add result</v-btn>
        </template>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { mdiDelete } from '@mdi/js';
import { useStore } from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineAsyncComponent,
  defineComponent, nextTick, onMounted, ref, watch,
} from '@vue/composition-api';

import { error } from '~/functions/error';
import { saveSettings } from '~/functions/settings';
import {
  maxValue, minValue, required,
} from '~/functions/validators';

export default defineComponent({
  components: { revertTextField: defineAsyncComponent(() => import('~/components/settings/modules/revert-text-field.vue')) },
  setup () {
    const settings = ref(null as Record<string, any> | null);
    const ui = ref(null as Record<string, any> | null);
    const store = useStore<any>();
    const valid = ref(true);
    const form = ref(null);

    watch(settings, () => {
      store.commit('settings/pending', true);
    }, { deep: true });

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/games/heist', store, settings.value);
      }
    });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    onMounted(() => {
      getSocket(`/games/heist`)
        .emit('settings', (err: string | null, _settings: { [x: string]: any }, _ui: { [x: string]: { [attr: string]: any } }) => {
          if (err) {
            error(err);
            return;
          }
          ui.value = _ui;
          console.log({ _settings });
          settings.value = _settings;
          nextTick(() => { store.commit('settings/pending', false); });
        });
    });

    const addLevel = () => {
      if (settings.value) {
        settings.value.levels.levelsValues[0].push({
          name:             '<changeit>',
          winPercentage:    10,
          payoutMultiplier: 1,
          maxUsers:         10,
        });
        settings.value.levels.levelsValues = [
          settings.value.levels.levelsValues[0],
          settings.value.levels.levelsValues[1],
        ];
      }
    };

    const removeLevel = (idx: number) => {
      if (settings.value) {
        settings.value.levels.levelsValues[0].splice(idx, 1);
        settings.value.levels.levelsValues = [
          settings.value.levels.levelsValues[0],
          settings.value.levels.levelsValues[1],
        ];
      }
    };

    const addResult = () => {
      if (settings.value) {
        settings.value.results.resultsValues[0].push({
          percentage: 10,
          message:    '<changeit>',
        });
        settings.value.results.resultsValues = [
          settings.value.results.resultsValues[0],
          settings.value.results.resultsValues[1],
        ];
      }
    };

    const removeResult = (idx: number) => {
      if (settings.value) {
        settings.value.results.resultsValues[0].splice(idx, 1);
        settings.value.results.resultsValues = [
          settings.value.results.resultsValues[0],
          settings.value.results.resultsValues[1],
        ];
      }
    };

    return {
      settings,
      ui,
      translate,
      valid,
      form,

      // validators
      required,
      minValue,
      maxValue,

      // functions
      addLevel,
      removeLevel,
      addResult,
      removeResult,

      // icons
      mdiDelete,
    };
  },
});
</script>
