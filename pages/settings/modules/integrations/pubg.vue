<template>
  <loading v-if="!settings" />
  <v-form v-else v-model="valid" lazy-validation>
    <v-tabs v-model="tab">
      <v-tab>{{ translate('categories.general') }}</v-tab>
      <v-tab>{{ translate('categories.customization') }}</v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab">
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <v-text-field v-model="settings.apiKey[0]" type="password" dense persistent-hint
              :hint="translate('integrations.pubg.settings.apiKey.help')"
              :label="translate('integrations.pubg.settings.apiKey.title')" />
            <v-select v-model="settings.player.platform[0]"
              :items="['steam', 'console', 'kakao', 'psn', 'stadia', 'xbox']"
              :label="translate('integrations.pubg.settings.platform')" />
            <v-text-field v-model="settings.player.playerName[0]" dense
              :label="translate('integrations.pubg.settings.playerName')" :loading="isSearching"
              @input="searchForPlayerId" />
            <v-text-field v-model="settings.player.playerId[0]" dense disabled
              :label="translate('integrations.pubg.settings.playerId')" />
          </v-card-text>
        </v-card>
      </v-tab-item>
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <v-revert-field v-model="settings.customization.rankedGameModeStatsCustomization" persistent-hint
              :label="translate('integrations.pubg.settings.rankedGameModeStatsCustomization')" :hint="example1"
              @input="updateExample(settings.customization.rankedGameModeStatsCustomization[0], 'rankedGameModeStats')">
              <template #append-outer>
                <v-select dense v-model='selectedRankedStats' class="ma-0"
                  @input="updateExample(settings.customization.rankedGameModeStatsCustomization[0], 'rankedGameModeStats')"
                  style="transform: translateY(-4px);"
                  :items="[{ value: null, text: '-- please select example --' }, ...Object.keys(settings.stats.rankedGameModeStats[0])]" />
              </template>
            </v-revert-field>
            <v-revert-field v-model="settings.customization.gameModeStatsCustomization" class="pt-4" persistent-hint
              :label="translate('integrations.pubg.settings.gameModeStatsCustomization')" :hint="example2"
              @input="updateExample(settings.customization.gameModeStatsCustomization[0], 'gameModeStats')">
              <template #append-outer>
                <v-select dense v-model='selectedNormalStats'
                  @input="updateExample(settings.customization.gameModeStatsCustomization[0], 'gameModeStats')"
                  class="ma-0" style="transform: translateY(-4px);"
                  :items="[{ value: null, text: '-- please select example --' }, ...Object.keys(settings.stats.gameModeStats[0])]" />
              </template>
            </v-revert-field>

            <label class="v-label theme--dark">
              {{ translate('integrations.pubg.player_stats_ranked') }}
            </label>
            <json-viewer :value="settings.stats.rankedGameModeStats[0]" />
            <small
              class="text-muted">{{ translate('integrations.pubg.stats_are_automatically_refreshed_every_10_minutes') }}</small>
            <br />
            <label class="v-label theme--dark">
              {{ translate('integrations.pubg.player_stats') }}
            </label>
            <json-viewer :value="settings.stats.gameModeStats[0]" />
            <small
              class="text-muted">{{ translate('integrations.pubg.stats_are_automatically_refreshed_every_10_minutes') }}</small>
          </v-card-text>
        </v-card>
      </v-tab-item>
    </v-tabs-items>
  </v-form>
</template>

<script lang="ts">
import { useStore } from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineAsyncComponent,
  defineComponent, nextTick, onMounted, ref, watch,
} from '@vue/composition-api';
import {
  cloneDeep, debounce, escapeRegExp,
} from 'lodash';
import JsonViewer from 'vue-json-viewer';

import { error } from '~/functions/error';
import { flatten } from '~/functions/flatten';
import { saveSettings } from '~/functions/settings';
import { minValue, required } from '~/functions/validators';

export default defineComponent({
  components: { JsonViewer, vRevertField: defineAsyncComponent(() => import('~/components/settings/modules/revert-text-field.vue')) },
  setup () {
    const settings = ref(null as Record<string, any> | null);
    const ui = ref(null as Record<string, any> | null);
    const store = useStore<any>();
    const valid = ref(true);
    const tab = ref(null);
    const isSearching = ref(false);

    const selectedRankedStats = ref(null as null | string);
    const selectedNormalStats = ref(null as null | string);

    const example1 = ref(`Stats not fetched or your user doesn't played any ranked yet`);
    const example2 = ref(`Stats not fetched or your user doesn't played any ranked yet`);

    watch(settings, () => {
      store.commit('settings/pending', true);
    }, { deep: true });

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/integrations/pubg', store, settings.value);
      }
    });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    const searchForPlayerId = debounce(() => {
      isSearching.value = true;
      getSocket(`/integrations/pubg`).emit('pubg::searchForPlayerId', {
        apiKey:     settings.value?.apiKey[0],
        platform:   settings.value?.player.platform[0],
        playerName: settings.value?.player.playerName[0],
      }, (err: null | string, data: any) => {
        isSearching.value = false;
        if (err) {
          error(err);
        } else if (settings.value) {
          settings.value.player.playerId = [data.data[0].id, settings.value?.player.playerId[1]];
        }
      });
    }, 1000);

    const updateExample = (value: string, statsType: string) => {
      const noValues = `Stats not fetched or your user doesn't played any ranked yet`;
      const selected = statsType === 'rankedGameModeStats' ? selectedRankedStats.value : selectedNormalStats.value;
      console.log({ selected });
      if (!selected) {
        const noSelect = 'Please select category before we can show you example stats.';
        if (statsType === 'rankedGameModeStats') {
          example1.value = noSelect;
        } else {
          example2.value = noSelect;
        }
        return;
      }

      if (!settings.value || Object.keys(settings.value.stats[statsType][0]).length === 0) {
        if (statsType === 'rankedGameModeStats') {
          example1.value = noValues;
        } else {
          example2.value = noValues;
        }
        return;
      }

      const dataset = settings.value?.stats[statsType][0][selected];
      let text = value || '';
      for (const key of Object.keys(flatten(dataset))) {
        text = text.replace(new RegExp(escapeRegExp(`$${key}`), 'gi'), flatten(dataset)[key]);
      }
      getSocket(`/integrations/pubg`).emit('pubg::exampleParse', { text }, (err, data: any) => {
        if (err) {
          error(err);
        } else if (statsType === 'rankedGameModeStats') {
          example1.value = data;
        } else {
          example2.value = data;
        }
      });
    };

    onMounted(() => {
      getSocket(`/integrations/pubg`)
        .emit('settings', (err, _settings, _ui) => {
          if (err) {
            error(err);
            return;
          }
          ui.value = _ui;
          console.log({ _settings });

          settings.value = cloneDeep(_settings);
          updateExample(settings.value.customization.rankedGameModeStatsCustomization[0], 'rankedGameModeStats');
          updateExample(settings.value.customization.gameModeStatsCustomization[0], 'gameModeStats');
          nextTick(() => { store.commit('settings/pending', false); });
        });
    });

    return {
      settings,
      ui,
      translate,
      valid,
      tab,
      example1,
      example2,
      isSearching,
      selectedRankedStats,
      selectedNormalStats,

      // functions
      updateExample,
      searchForPlayerId,

      // validators
      required,
      minValue,
    };
  },
});
</script>
