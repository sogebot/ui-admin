<template>
  <v-expansion-panels v-model="model" multiple>
    <slot />
    <v-expansion-panel>
      <v-expansion-panel-header>Settings</v-expansion-panel-header>
      <v-expansion-panel-content>
        <form-x-time-input v-model.lazy="options.currentTime" label="Current time" hide-details="auto" />

        <v-switch v-model="options.isPersistent" label="Persistent" :persistent-hint="true" :hint="(options.isPersistent ? 'Countdown will keep value on browser source load, you will need to reset by dashboard\'s action button.' : 'Countdown will reset on browser source load.')" />
        <v-switch v-model="options.isStartedOnSourceLoad" label="Start automatically" :persistent-hint="true" :hint="(options.isStartedOnSourceLoad ? 'Countdown will start automatically on browser source load.' : 'Countdown won\'t start on browser source load, you will need to start it by dashboard\'s action button.')" />
        <v-switch v-model="options.showMilliseconds" label="Show milliseconds" />
      </v-expansion-panel-content>
    </v-expansion-panel>
    <v-expansion-panel>
      <v-expansion-panel-header>REST calls</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-alert type="info" border="bottom">List of available calls, all calls need to have authorization token.</v-alert>
        <pre class="pb-4">POST http://localhost:3000/api/overlays/stopwatch/{{id}}/start
Authorization: Bearer &lt;socketToken&gt;</pre>
        <pre class="pb-4">POST http://localhost:3000/api/overlays/stopwatch/{{id}}/stop
Authorization: Bearer &lt;socketToken&gt;</pre>
        <pre class="pb-4">POST http://localhost:3000/api/overlays/stopwatch/{{id}}/toggle
Authorization: Bearer &lt;socketToken&gt;</pre>
        <pre class="pb-4">POST http://localhost:3000/api/overlays/stopwatch/{{id}}/resetAndStop
Authorization: Bearer &lt;socketToken&gt;</pre>
        <pre>POST http://localhost:3000/api/overlays/stopwatch/{{id}}/reset
Authorization: Bearer &lt;socketToken&gt;</pre>
      </v-expansion-panel-content>
    </v-expansion-panel>
    <v-expansion-panel>
      <v-expansion-panel-header>Stopwatch font</v-expansion-panel-header>
      <v-expansion-panel-content>
        <font v-model="options.stopwatchFont" />
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import {
  defineAsyncComponent,
  defineComponent, ref, watch,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';
import { isEqual } from 'lodash';

import { setDefaultOpts } from '~/../backend/src/helpers/overlaysDefaultValues';

export default defineComponent({
  components: { font: defineAsyncComponent(() => import('~/components/form/expansion/font.vue')) },
  props:      { value: [Object, Array], id: String },
  setup (props, ctx) {
    const model = ref([0]);
    const id = ref(props.id!);
    const options = ref(setDefaultOpts(props.value!.opts, 'stopwatch'));

    watch(() => options.value.currentTime, (val) => {
      if (val < 0) {
        options.value.currentTime = 0;
      }
    });

    watch(options, (val) => {
      if (!isEqual(props.value, { ...props.value, opts: val })) {
        ctx.emit('input', val);
      }
    }, { deep: true, immediate: true });

    return {
      model,
      options,
      translate,
    };
  },
});
</script>
