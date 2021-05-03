<template>
  <v-col
    cols="6"
    lg="2"
    md="4"
    sm="4"
    class="pa-1"
  >
    <v-skeleton-loader
      v-if="!isLoaded"
      tile
      type="card"
      min-height="60"
      max-height="60"
    />
    <v-hover
      v-else
    >
      <template #default="{ hover }">
        <v-card
          tile
          min-height="60"
          elevation="5"
        >
          <v-card-title
            :key="timestamp"
            class="pa-1"
          >
            {{ getTime(uptime, false) }}
          </v-card-title>
          <v-card-subtitle class="pa-1 text-caption">
            {{ capitalize(translate('uptime')) }}
          </v-card-subtitle>

          <v-fade-transition>
            <v-overlay
              v-if="hover"
              absolute
              color="#333"
            >
              <v-btn x-small @click="saveHighlight">
                {{ translate('click-to-highlight') }}
              </v-btn>
            </v-overlay>
          </v-fade-transition>
        </v-card>
      </template>
    </v-hover>
  </v-col>
</template>

<script lang="ts">
import { getTime } from '@sogebot/ui-helpers/getTime';
import { getSocket } from '@sogebot/ui-helpers/socket';
import { defineComponent } from '@vue/composition-api';
import translate from '@sogebot/ui-helpers/translate';
import { capitalize } from 'lodash-es';

export default defineComponent({
  props: {
    isLoaded:  Boolean,
    uptime:    Number,
    timestamp: Number,
  },
  setup () {
    const saveHighlight = () => getSocket('/systems/highlights').emit('highlight');

    return { saveHighlight, getTime, translate, capitalize };
  },
});
</script>
