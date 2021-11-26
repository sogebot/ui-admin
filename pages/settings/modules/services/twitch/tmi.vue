<template>
        <v-card>
          <v-card-text>
            <v-switch class="mt-0" v-model="_settings.general.isTitleForced[0]" dense
              :label="translate('core.twitch.settings.isTitleForced')" />
            <v-switch class="mt-0" v-model="_settings.chat.sendWithMe[0]" dense
              :label="translate('core.tmi.settings.sendWithMe')" />
            <v-switch class="mt-0" v-model="_settings.chat.mute[0]" dense :label="translate('core.tmi.settings.mute')" />
            <v-switch class="mt-0" v-model="_settings.chat.whisperListener[0]" dense
              :label="translate('core.tmi.settings.whisperListener')" />
            <v-switch class="mt-0" v-model="_settings.chat.showWithAt[0]" dense
              :label="translate('core.tmi.settings.showWithAt')" />
            <v-switch class="mt-0" v-model="_settings.chat.sendAsReply[0]" dense
              :label="translate('core.tmi.settings.sendAsReply')" />
            <v-textarea class="mt-3 pt-3" outlined rows="5" persistent-hint
              :label="translate('core.tmi.settings.ignorelist')"
              :value="_settings.chat.ignorelist[0].filter(String).join('\n')" :hint="translate('one-record-per-line')"
              @input="_settings.chat.ignorelist[0] = $event.split('\n').filter(String); $store.commit('settings/pending', true);" />
            <v-autocomplete v-model="_settings.chat.globalIgnoreListExclude[0]"
              :label="translate('core.tmi.settings.globalIgnoreListExclude')"
              :items="Object.keys(globalIgnoreList).map(k => k)" cache-items multiple :filter="customFilter"
              @input="$store.commit('settings/pending', true)">
              <template v-slot:selection="data">
                <v-chip v-bind="data.attrs" :input-value="data.selected" close small @click:close="remove(data.item)">
                  <strong class='text-caption pr-2'>{{ data.item }}</strong>
                  {{globalIgnoreList[data.item].known_aliases[0]}}
                </v-chip>
              </template>
              <template v-slot:item="data">
                <v-list-item-content>
                  <v-list-item-title><strong class='text-caption'>id:</strong> {{data.item}}</v-list-item-title>
                  <v-list-item-subtitle><strong class='text-caption'>Known as:</strong>
                    {{globalIgnoreList[data.item].known_aliases.join(', ')}} </v-list-item-subtitle>
                  <v-list-item-subtitle><strong class='text-caption'>Reason:</strong>
                    {{globalIgnoreList[data.item].reason}}</v-list-item-subtitle>
                </v-list-item-content>
              </template>
            </v-autocomplete>
          </v-card-text>
        </v-card>
</template>

<script lang="ts">
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';

import { minValue, required } from '~/functions/validators';

type Props = {
  settings: Record<string, any>,
};

export default defineComponent({
  props: { settings: Object },
  setup (props: Props, ctx) {
    const _settings = ref(props.settings);
    watch(_settings, (val) => {
      ctx.emit('input', val);
    }, { deep: true });

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

    onMounted(() => {
      fetch((process.env.isNuxtDev ? 'http://localhost:20000/' : '/') + 'assets/globalIgnoreList.json')
        .then(response => response.json())
        .then((data) => {
          globalIgnoreList.value = data;
        });
    });

    const remove = (item: string) => {
      if (!_settings.value) {
        return;
      }
      const index = _settings.value.chat.globalIgnoreListExclude[0].indexOf(item);
      if (index >= 0) {
        _settings.value.chat.globalIgnoreListExclude[0].splice(index, 1);
      }
    };

    return {
      _settings,
      translate,
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
