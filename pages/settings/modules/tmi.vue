<template>
  <loading v-if="!settings" />
  <v-card v-else flat class="fill-height">
    <v-card-text>
      <v-form ref="form" v-model="valid">
        <v-checkbox
          v-model="settings.chat.sendWithMe[0]"
          dense
          :label="translate('core.tmi.settings.sendWithMe')"
        />
        <v-checkbox
          v-model="settings.chat.mute[0]"
          dense
          :label="translate('core.tmi.settings.mute')"
        />
        <v-checkbox
          v-model="settings.chat.whisperListener[0]"
          dense
          :label="translate('core.tmi.settings.whisperListener')"
        />
        <v-checkbox
          v-model="settings.chat.showWithAt[0]"
          dense
          :label="translate('core.tmi.settings.showWithAt')"
        />
        <v-textarea
          outlined
          rows="5"
          persistent-hint
          :label="translate('core.tmi.settings.ignorelist')"
          :value="settings.chat.ignorelist[0].filter(String).join('\n')"
          :hint="translate('one-record-per-line')"
          @input="settings.chat.ignorelist[0] = $event.split('\n').filter(String)"
        />

        <v-autocomplete
          v-model="settings.chat.globalIgnoreListExclude[0]"
          :label="translate('core.tmi.settings.globalIgnoreListExclude')"
          :items="Object.keys(globalIgnoreList).map(k => k)"
          cache-items
          multiple
          :filter="customFilter"
          @input="$store.commit('settings/pending', true)"
        >
        <template v-slot:selection="data">
          <v-chip
            v-bind="data.attrs"
            :input-value="data.selected"
            close
            small
            @click:close="remove(data.item)"
          >
            <strong class='text-caption pr-2'>{{ data.item }}</strong> {{globalIgnoreList[data.item].known_aliases[0]}}
          </v-chip>
        </template>
          <template v-slot:item="data">
            <v-list-item-content>
              <v-list-item-title><strong class='text-caption'>id:</strong> {{data.item}}</v-list-item-title>
              <v-list-item-subtitle><strong class='text-caption'>Known as:</strong> {{globalIgnoreList[data.item].known_aliases.join(', ')}} </v-list-item-subtitle>
              <v-list-item-subtitle><strong class='text-caption'>Reason:</strong> {{globalIgnoreList[data.item].reason}}</v-list-item-subtitle>
            </v-list-item-content>
          </template>
        </v-autocomplete>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { useStore } from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, nextTick, onMounted, ref, watch,
} from '@vue/composition-api';

import { error } from '~/functions/error';
import { saveSettings } from '~/functions/settings';
import { minValue, required } from '~/functions/validators';

export default defineComponent({
  setup () {
    const settings = ref(null as Record<string, any> | null);
    const ui = ref(null as Record<string, any> | null);
    const store = useStore<any>();
    const valid = ref(true);
    const form = ref(null);
    const globalIgnoreList = ref({} as {
      [x: string]: {
        reason: string,
        // eslint-disable-next-line camelcase
        known_aliases: string[],
      }
    });
    const customFilter = (item: string, queryText: string) => {
      const aliases = globalIgnoreList.value[item].known_aliases;
      return item.includes(queryText) || aliases.find(o => o.includes(queryText));
    };

    watch(settings, () => {
      store.commit('settings/pending', true);
    }, { deep: true });

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/core/tmi', store, settings.value);
      }
    });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    onMounted(() => {
      getSocket(`/core/tmi`)
        .emit('settings', (err: string | null, _settings: { [x: string]: any }, _ui: { [x: string]: { [attr: string]: any } }) => {
          if (err) {
            error(err);
            return;
          }
          ui.value = _ui;
          settings.value = _settings;
          nextTick(() => { store.commit('settings/pending', false); });
        });

      fetch((process.env.isNuxtDev ? 'http://localhost:20000/' : '/') + 'assets/globalIgnoreList.json')
        .then(response => response.json())
        .then((data) => {
          globalIgnoreList.value = data;
        });
    });

    const remove = (item: string) => {
      if (!settings.value) {
        return;
      }
      const index = settings.value.chat.globalIgnoreListExclude[0].indexOf(item);
      if (index >= 0) {
        settings.value.chat.globalIgnoreListExclude[0].splice(index, 1);
        store.commit('settings/pending', true);
      }
    };

    return {
      settings,
      ui,
      translate,
      valid,
      form,
      globalIgnoreList,
      remove,
      customFilter,

      // validators
      required,
      minValue,
    };
  },
});
</script>
