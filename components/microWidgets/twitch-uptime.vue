<template>
  <v-col
    cols="6"
    lg="2"
    md="4"
    sm="4"
    style="padding: 2px;"
  >
    <v-hover>
      <template #default="{ hover }">
        <v-card
          tile
          min-height="48"
          elevation="5"
          :loading="!isLoaded"
        >
          <v-card-title
            :key="timestamp"
            class="px-1 py-0 text-truncate"
            style="font-size: 1rem;"
          >
            <template>
              {{ getTime(uptime, false) }}
            </template>
          </v-card-title>
          <v-card-subtitle class="pa-1 pt-2 text-caption text-truncate">
            {{ capitalize($t('uptime')) }}
          </v-card-subtitle>

          <v-fade-transition>
            <v-overlay
              v-if="hover"
              absolute
              color="#333"
            >
              <v-btn x-small @click="saveHighlight">
                {{ $t('click-to-highlight') }}
              </v-btn>
            </v-overlay>
          </v-fade-transition>
        </v-card>
      </template>
    </v-hover>
  </v-col>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api';
import { getTime } from '@sogebot/ui-helpers/getTime';
import { getSocket } from '@sogebot/ui-helpers/socket';
import { capitalize } from 'lodash';

export default defineComponent({
  props: {
    isLoaded:  Boolean,
    uptime:    Number,
    timestamp: Number,
  },
  setup () {
    const saveHighlight = () => getSocket('/systems/highlights').emit('highlight');

    return {
      saveHighlight, getTime, capitalize,
    };
  },
});
</script>
