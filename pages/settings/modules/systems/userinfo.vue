<template>
  <loading v-if="!settings" />
  <v-form v-else v-model="valid" lazy-validation>
    <v-tabs v-model="tab">
      <v-tab>{{ translate('categories.customization') }}</v-tab>
      <v-tab>{{ translate('categories.me') }}</v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab">
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <revert-text-field
              v-model="settings.customization.lastSeenFormat"
              class="pt-3"
              :label="translate('systems.userinfo.settings.lastSeenFormat.title')"
              :hint="translate('systems.userinfo.settings.lastSeenFormat.help')"
              :rules="[required]"
            />
          </v-card-text>
        </v-card>
      </v-tab-item>
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <revert-text-field
              v-model="settings.me.formatSeparator"
              class="pt-3"
              :label="translate('systems.userinfo.settings.formatSeparator')"
              :rules="[required]"
            />
            <label class="v-label theme--dark">
              {{ translate('systems.userinfo.settings.order') }}
            </label>
            <v-simple-table dense>
              <template #default>
                <tbody>
                  <tr v-for="(item , idx) of settings.me.order[0]" :key="item">
                    <td>
                      <v-icon v-if="idx !== 0" @click.stop="swapOrder(idx, idx - 1)">
                        mdi-chevron-up
                      </v-icon>
                      <v-icon v-if="idx !== settings.me.order[0].length - 1" @click.stop="swapOrder(idx, idx + 1)">
                        mdi-chevron-down
                      </v-icon>
                    </td>
                    <td>{{ item }}</td>
                    <td>
                      <v-icon @click="toggleVisibility(item)">
                        {{ settings.me._formatDisabled[0].includes(item) ? 'mdi-eye-off' : 'mdi-eye' }}
                      </v-icon>
                    </td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
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
import { xor } from 'lodash';

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
    const tab = ref(null);

    watch(settings, () => {
      store.commit('settings/pending', true);
    }, { deep: true });

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/systems/userinfo', store, settings.value);
      }
    });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    onMounted(() => {
      getSocket(`/systems/userinfo`)
        .emit('settings', (err, _settings, _ui) => {
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

    const swapOrder = (order1: number, order2: number) => {
      if (settings.value) {
        const item1 = settings.value.me.order[0][order1];
        const item2 = settings.value.me.order[0][order2];
        if (item1 && item2) {
          settings.value.me.order[0][order1] = item2;
          settings.value.me.order[0][order2] = item1;
          settings.value.me.order = [settings.value.me.order[0], settings.value.me.order[1]];
        }
      }
    };

    const toggleVisibility = (item: string) => {
      if (settings.value) {
        settings.value.me._formatDisabled = [xor(settings.value.me._formatDisabled[0], [item]), settings.value.me._formatDisabled[1]];
      }
    };

    return {
      settings,
      ui,
      translate,
      valid,
      tab,

      // validators
      required,
      minValue,
      maxValue,

      // functions
      swapOrder,
      toggleVisibility,
    };
  },
});
</script>
