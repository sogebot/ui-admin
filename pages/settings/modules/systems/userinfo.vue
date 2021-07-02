<template>
  <loading v-if="!settings" />
  <v-card v-else flat style="min-height: 100%;">
    <v-card-text>
      <v-form ref="form" v-model="valid">
        <template>
          <v-card-title class="pt-0 pb-0">{{ translate('categories.customization') }}</v-card-title>

          <revert-text-field
            class="pt-3"
            v-model="settings.customization.lastSeenFormat"
            :label="translate('systems.userinfo.settings.lastSeenFormat.title')"
            :hint="translate('systems.userinfo.settings.lastSeenFormat.help')"
            :rules="[required]"
          />
        </template>
        <template>
          <v-card-title class="pt-0 pb-0">{{ translate('categories.me') }}</v-card-title>

          <revert-text-field
            class="pt-3"
            v-model="settings.me.formatSeparator"
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
                    <v-icon v-if="idx !== 0" @click.stop="swapOrder(idx, idx - 1)">{{ mdiChevronUp }}</v-icon>
                    <v-icon v-if="idx !== settings.me.order[0].length - 1" @click.stop="swapOrder(idx, idx + 1)">{{ mdiChevronDown }}</v-icon>
                  </td>
                  <td>{{item}}</td>
                  <td>
                    <v-icon @click="toggleVisibility(item)">
                      {{ settings.me._formatDisabled[0].includes(item) ? mdiEyeOff : mdiEye }}
                    </v-icon>
                  </td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
        </template>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import {
  mdiChevronDown, mdiChevronUp, mdiEye, mdiEyeOff,
} from '@mdi/js';
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
    const form = ref(null);

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
      form,

      // validators
      required,
      minValue,
      maxValue,

      // functions
      swapOrder,
      toggleVisibility,

      // icons
      mdiChevronUp,
      mdiChevronDown,
      mdiEye,
      mdiEyeOff,
    };
  },
});
</script>
