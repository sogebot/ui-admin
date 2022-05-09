<template>
  <div>
    <draggable
      v-model="responsesUpdated"
      draggable=".item"
      handle=".handle"
    >
      <v-list-item
        v-for="(r, i) of responsesUpdated"
        :key="'response' + i"
        class="item"
      >
        <v-list-item-content>
          <v-row>
            <v-col
              cols="12"
            >
              <v-lazy>
                <v-textarea
                  v-model="responsesUpdated[i].response"
                  hide-details="auto"
                  :label="translate('response') + '#' + (i + 1)"
                  :rows="1"
                  counter
                  auto-grow
                  :autofocus="i === 0"
                  @keydown.enter.prevent
                >
                  <template #prepend>
                    <v-icon class="handle">
                      mdi-drag
                    </v-icon>
                  </template>
                  <template #append>
                    <input-variables
                      :filters="['sender']"
                      @input="responsesUpdated[i].response = responsesUpdated[i].response + $event"
                    />
                  </template>
                  <template #append-outer>
                    <v-btn
                      icon
                      @click="responsesUpdated[i].isEnabled = !responsesUpdated[i].isEnabled"
                    >
                      <v-icon v-if="responsesUpdated[i].isEnabled">
                        mdi-checkbox-marked-circle
                      </v-icon>
                      <v-icon v-else>
                        mdi-checkbox-blank-circle-outline
                      </v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      @click="remove(i)"
                    >
                      <v-icon>mdi-delete-forever</v-icon>
                    </v-btn>
                  </template>
                </v-textarea>
              </v-lazy>
            </v-col>
          </v-row>
        </v-list-item-content>
      </v-list-item>
    </draggable>
    <v-btn @click="responsesUpdated.push({ order: Date.now(), response: '', isEnabled: true })">
      {{ translate('systems.customcommands.addResponse') }}
    </v-btn>
  </div>
</template>

<script lang="ts">
import type { TimerResponseInterface } from '@entity/timer';
import translate from '@sogebot/ui-helpers/translate';
import { capitalize } from 'lodash';
import draggable from 'vuedraggable';

export default defineComponent({
  components: {
    draggable,
    'input-variables': defineAsyncComponent({ loader: () => import('~/components/inputVariables.vue') }),
  },
  props: { value: Array, name: String },
  setup (props, ctx) {
    const responsesUpdated = ref((props.value ?? []) as TimerResponseInterface[]);

    watch(responsesUpdated, (val) => {
      ctx.emit('input', val);
    }, { deep: true });

    const remove = (idx: number) => {
      responsesUpdated.value.splice(idx, 1);
    };

    return {
      translate,
      capitalize,
      remove,
      responsesUpdated,
    };
  },
});
</script>
