<template>
  <v-expansion-panels v-model="model">
    <slot />
    <v-expansion-panel :readonly="typeof $slots.default === 'undefined'">
      <v-expansion-panel-header>Settings</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-text-field
          v-model="options.address"
          :label="translate('integrations.obswebsocket.settings.address')"
        />
        <v-text-field
          v-model="options.password"
          type="password"
          :label="translate('integrations.obswebsocket.settings.password')"
        />
        <v-textarea
          :value="options.allowedIPs.join('\n')"
          rows="5"
          :label="translate('registry.overlays.allowedIPs.name')"
          :hint="translate('registry.overlays.allowedIPs.help')"
          persistent-hint
          @input="options.allowedIPs = $event.split('\n')"
        />
        <v-btn @click="addCurrentIP(options.allowedIPs)">
          Add current IP
        </v-btn>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
  </span>
</template>

<script lang="ts">
import {
  defineComponent, ref, watch,
} from '@nuxtjs/composition-api';
import { getCurrentIP } from '@sogebot/ui-helpers/getCurrentIP';
import translate from '@sogebot/ui-helpers/translate';
import { isEqual } from 'lodash';

import { setDefaultOpts } from '~/../backend/src/helpers/overlaysDefaultValues';

export default defineComponent({
  props: { value: Object },
  setup (props, ctx) {
    const model = ref(0);

    const options = ref(setDefaultOpts(props.value!.opts, 'obswebsocket'));

    watch(options, (val) => {
      if (!isEqual(props.value, { ...props.value, opts: val })) {
        ctx.emit('input', val);
      }
    }, { deep: true, immediate: true });

    const addCurrentIP = (array: string[]) => {
      getCurrentIP().then((value) => {
        if (array[array.length - 1] === '') {
          array[array.length - 1] = value;
        } else {
          array.push(value);
        }
      });
    };

    return {
      addCurrentIP,
      options,
      translate,
      model,
    };
  },
});
</script>
