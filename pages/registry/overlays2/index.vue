<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <v-row dense>
      <v-col cols="auto">
        <v-card>
          <v-card-text class="pa-0">
              <v-subheader style="height: 30px">Overlays</v-subheader>
            <v-list dense class="pa-0">
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>Eventlist</v-list-item-title>
                </v-list-item-content>
                <v-list-item-action>
                  <div>
                <v-icon
                  color="grey lighten-1"
                >
                  {{ mdiWrench }}
                </v-icon>
                <v-icon
                  color="grey lighten-1"
                >
                  {{ mdiEyeOutline }}
                </v-icon>
                <v-icon
                  color="grey lighten-1"
                >
                  {{ mdiDelete }}
                </v-icon>
                  </div>
              </v-list-item-action>
              </v-list-item>

              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>Item 2</v-list-item-title>
                </v-list-item-content>
                <v-list-item-action>
                  <div>
                <v-icon
                  color="grey lighten-1"
                >
                  {{ mdiWrench }}
                </v-icon>
                <v-icon
                  color="grey lighten-1"
                >
                  {{ mdiEyeOutline }}
                </v-icon>
                <v-icon
                  color="grey lighten-1"
                >
                  {{ mdiDelete }}
                </v-icon>
                  </div>
              </v-list-item-action>
              </v-list-item>
            </v-list>

            <v-btn block color="pink" dark>
              <v-icon>{{ mdiPlus }}</v-icon>
            </v-btn>
          </v-card-text>
        </v-card>
        <v-card class="mt-2">
          <v-card-text class="pa-0">
              <v-subheader style="height: 30px;">Settings</v-subheader>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col>
        <v-card>
          <v-responsive :aspect-ratio="16/9">
            <v-card-text>
            </v-card-text>
          </v-responsive>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import {
  mdiDelete, mdiEyeOutline, mdiPlus, mdiWrench,
} from '@mdi/js';
import { defineComponent } from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import translate from '@sogebot/ui-helpers/translate';

export default defineComponent({
  setup () {
    return {
      // refs
      translate,
      ButtonStates,

      // functions

      // icons
      mdiPlus,
      mdiWrench,
      mdiEyeOutline,
      mdiDelete,
    };
  },
});
</script>
