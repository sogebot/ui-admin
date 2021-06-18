<template>
  <v-row class="pb-4">
    <v-col cols="auto">
      <label class="v-label theme--dark">
        {{ translate('registry.alerts.layoutPicker.name') }}
      </label>
    </v-col>
    <v-col>
      <v-item-group v-model="model" mandatory>
        <v-container fluid>
          <v-row>
            <v-col v-for="idx of 5" :key="idx" cols="auto">
              <v-item v-slot="{ active, toggle }">
                <v-card
                  :color="active ? 'primary' : ''"
                  class="d-flex align-center"
                  dark
                  @click="toggle"
                >
                  <v-img :src="`/_static/layout${idx}.png`" />
                </v-card>
              </v-item>
            </v-col>
          </v-row>
        </v-container>
      </v-item-group>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import {
  defineComponent, ref, watch,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';

export default defineComponent({
  props: { value: String },
  setup (props, ctx) {
    const model = ref(Number(props.value));
    watch(model, (val) => {
      ctx.emit('input', String(Number(val) + 1));
    });
    return { model, translate };
  },
});
</script>
