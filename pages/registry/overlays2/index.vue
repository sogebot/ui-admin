<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
        <v-card>
            <v-btn fab absolute right bottom color="primary" dark small style="z-index: 999">
              <v-icon>{{ mdiPlus }}</v-icon>
            </v-btn>
          <v-responsive :aspect-ratio="16/9">
            <v-card-text>
              <v-sheet color="primary" height="100" width="200" style="position: absolute; cursor: grab; user-select: none;">
                 <v-sheet color="grey darken-4" style="position: absolute; right: -35px; height: 100%">
                  <v-btn icon block><v-icon>{{ mdiWrench }}</v-icon></v-btn>
                  <v-btn color="red" icon  block><v-icon>{{ mdiDelete }}</v-icon></v-btn>
                 </v-sheet>
                 <div class="text-right pa-1 text-caption">100x200<br />
                  <v-icon x-small>{{ mdiFormatHorizontalAlignRight }}</v-icon> 100
                  <v-icon x-small>{{ mdiFormatVerticalAlignBottom }}</v-icon> 100
                 </div>
                 <div class="center text-button text-truncate">Eventlist</div>
              </v-sheet>
              <v-sheet color="grey darken-3" height="150" width="75" style="position: absolute; top: 200px; left: 100px; cursor: grab; user-select: none;">
                 <div class="center text-button text-truncate">Item 2</div>
              </v-sheet>
            </v-card-text>
          </v-responsive>
        </v-card>
  </v-container>
</template>

<script lang="ts">
import {
  mdiCircle, mdiCircleOutline, mdiDelete, mdiEyeOutline, mdiFormatHorizontalAlignRight, mdiFormatVerticalAlignBottom, mdiPlus, mdiWrench,
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
      mdiFormatHorizontalAlignRight,
      mdiFormatVerticalAlignBottom,
      mdiCircle,
      mdiCircleOutline,
    };
  },
});
</script>
