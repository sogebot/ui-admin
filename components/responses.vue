<template>
  <ul style="list-style-type: none;" class="responses">
    <li
      v-if="responses.length === 0"
      class="text--lighten-1  red--text"
    >{{ translate('systems.customcommands.no-responses-set') }}</li>
    <span v-if="!$vuetify.breakpoint.mobile">
      <template v-for="(r, i) of responses">
        <li
          :key="i"
        >
          <v-divider
            v-if="i > 0"
          />
          <v-row>
            <v-col
              cols="auto"
              class="caption"
            >
              {{ translate('response') }}#{{ i + 1 }}
            </v-col>
            <v-col
              cols="auto"
              class="caption"
            >
              <v-icon>{{ mdiKey }}</v-icon>
              {{ getPermissionName(r.permission, permissions) }}
            </v-col>
            <v-col
              cols="auto"
              class="caption"
            >
              <v-icon v-if="r.stopIfExecuted">
                {{ mdiPause }}
              </v-icon>
              <v-icon v-else>
                {{ mdiPlay }}
              </v-icon>
              {{ r.stopIfExecuted ? translate('commons.stop-if-executed') : translate('commons.continue-if-executed') }}
            </v-col>
            <v-col
              v-if="r.filter.length > 0"
              class="caption"
            >
              <v-icon>
                {{ mdiFilter }}
              </v-icon>
              <text-with-tags
                class="d-inline-block"
                :value="r.filter"
              />
            </v-col>
          </v-row>
          <text-with-tags :value="r.response" class="pl-4" />
        </li>
      </template>
    </span>
    <span v-else>
      {{responses.length}} responses set
    </span>
  </ul>
</template>

<script lang="ts">
import {
  mdiDrag, mdiFilter, mdiKey, mdiPause, mdiPlay, mdiTrashCan,
} from '@mdi/js';
import { defineAsyncComponent, defineComponent } from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';
import { capitalize, orderBy } from 'lodash';

import { getPermissionName } from '~/functions/getPermissionName';

export default defineComponent({
  components: {
    'text-with-tags': defineAsyncComponent({
      loader: () => import('~/components/textWithTags.vue'),
    }),
  },
  props: {
    responses: Array, name: String, permissions: Array,
  },
  setup () {
    return {
      orderBy,
      translate,
      capitalize,
      getPermissionName,

      mdiPause,
      mdiPlay,
      mdiFilter,
      mdiDrag,
      mdiKey,
      mdiTrashCan,
    };
  },
});
</script>

<style scoped>
.responses li {
  padding-bottom: 5px;
}
</style>
