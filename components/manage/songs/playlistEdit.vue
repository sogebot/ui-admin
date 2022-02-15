<template>
  <div>
    <v-dialog
      v-model="menu"
      persistent
      max-width="1000"
      scrollable
      :fullscreen="$vuetify.breakpoint.mobile"
    >
      <template #activator="{ on, attrs }">
        <v-btn v-if="item.videoId !== undefined" icon v-bind="attrs" class="primary-hover" v-on="on">
          <v-icon>
            mdi-pencil
          </v-icon>
        </v-btn>
        <v-btn v-else v-bind="attrs" color="primary" v-on="on">
          New item
        </v-btn>
      </template>
      <v-card outlined class="pt-3">
        <v-card-text>
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-row>
              <v-col md="5" cols="12">
                <vue-plyr
                  ref="playerRef"
                >
                  <div
                    data-plyr-provider="youtube"
                    :data-plyr-embed-id="item.videoId"
                  />
                </vue-plyr>
              </v-col>
              <v-col>
                <v-row dense>
                  <v-col cols="auto" align-self="center">
                    <v-btn-toggle
                      v-model="item.forceVolume"
                    >
                      <v-btn :value="false" small outlined>
                        {{ translate('systems.songs.calculated') }}
                      </v-btn>
                      <v-btn :value="true" small outlined>
                        {{ translate('systems.songs.set_manually') }}
                      </v-btn>
                    </v-btn-toggle>
                  </v-col>
                  <v-col>
                    <v-text-field
                      v-model.number="item.volume"
                      :label="translate('systems.songs.settings.volume')"
                      min="0"
                      max="100"
                      type="number"
                      :rules="rules.volume"
                      :disabled="!item.forceVolume"
                    />
                  </v-col>
                </v-row>
                <v-row class="mt-0">
                  <v-col>
                    <v-combobox
                      v-model="item.tags"
                      :label="translate('tags')"
                      multiple
                      :return-object="false"
                      :items="tagsItemsWithoutNull"
                      @input="ensureGeneralTag(item)"
                    >
                      <template #no-data>
                        <v-list-item>
                          <span class="subheading">Add new tag</span>
                        </v-list-item>
                      </template>
                    </v-combobox>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>

                <v-row class="mt-0">
                  <v-col>
                    <v-range-slider
                      class="playlist-item-trim"
                      v-model="range"
                      label="Trim song"
                      :max="item.length"
                      min="0"
                    >
                    <template v-slot:prepend>
                    <v-text-field
                      v-model.number="item.startTime"
                      min="0"
                      :max="Number(item.endTime) - 1"
                      type="number"
                      :rules="rules.startTime"
                      hide-details="auto"
                    >
                      <template #prepend>
                        <v-btn icon @click="startSegment">
                          <v-icon>mdi-format-horizontal-align-left</v-icon>
                        </v-btn>
                      </template>
                    </v-text-field>
                    </template>
                    <template #append>
                    <v-text-field
                      v-model.number="item.endTime"
                      :min="Number(item.startTime) + 1"
                      :max="item.length"
                      type="number"
                      :rules="rules.endTime"
                      hide-details="auto"
                    >
                      <template #append-outer>
                        <v-btn icon @click="endSegment">
                          <v-icon>mdi-format-horizontal-align-right</v-icon>
                        </v-btn>
                      </template>
                    </v-text-field>
                    </template>
                    </v-range-slider>
                  </v-col>
                </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />

          <v-btn text @click="menu = false">
            Cancel
          </v-btn>
          <v-btn color="primary" :loading="saving" text :disabled="!valid" @click="save()">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import VuePlyr from '@skjnldsv/vue-plyr';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  computed,
  defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';
import capitalize from 'lodash/capitalize';
import cloneDeep from 'lodash/cloneDeep';
import Vue from 'vue';

import type { SongPlaylistInterface } from '@entity/song';
import { EventBus } from '~/functions/event-bus';

Vue.use(VuePlyr, {
  plyr: {
  },
});

type Props = {
  value: SongPlaylistInterface;
  rules: [];
  tagsItems: [];
};

export default defineComponent({
  filters: {
    formatTime (seconds: number) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return [
        h,
        m > 9 ? m : (h ? '0' + m : m || '0'),
        s > 9 ? s : '0' + s,
      ].filter(a => a).join(':');
    },
  },
  props: {
    value:           Object,
    rules:           Object,
    permissionItems: Array,
    tagsItems:       Array,
  },
  setup (props: Props, ctx) {
    const menu = ref(false);
    const item = ref(cloneDeep(props.value));
    const valid = ref(true);
    const form = ref(null);
    const saving = ref(false);

    const range = ref([item.value.startTime, item.value.endTime]);

    watch(range, (val) => {
      if (item.value.startTime !== val[0]) {
        item.value.startTime = val[0];
      }
      if (item.value.endTime !== val[1]) {
        item.value.endTime = val[1];
      }
    });

    watch([() => item.value.startTime, () => item.value.endTime], (val) => {
      range.value = [val[0], val[1]];
    });

    const playerRef = ref(null as null | any);
    const player = computed(() => {
      return playerRef.value ? playerRef.value.player : null;
    });
    const currentTime = ref(0);

    const resetForm = () => {
      valid.value = true;
      if (form.value as unknown) {
        (form.value as unknown as HTMLFormElement).resetValidation();
        item.value = cloneDeep(props.value);
      } else {
        setTimeout(() => {
          resetForm();
        }, 100);
      }
    };

    watch(menu, (val) => {
      if (val) {
        resetForm();
      }
    });

    const save = () => {
      if ((form.value as unknown as HTMLFormElement).validate()) {
        // check validity
        for (const key of Object.keys(props.rules)) {
          for (const rule of (props.rules as any)[key]) {
            const ruleStatus = rule((item.value as any)[key]);
            if (ruleStatus === true) {
              continue;
            } else {
              EventBus.$emit('snack', 'red', `[${key}] - ${ruleStatus}`);
              return;
            }
          }
        }
        saving.value = true;
        item.value.volume = Number(item.value.volume);
        item.value.startTime = Number(item.value.startTime);
        item.value.endTime = Number(item.value.endTime);
        getSocket('/systems/songs').emit('songs::save', item.value, (err: string | null) => {
          if (err) {
            console.error(err);
            saving.value = false;
            return;
          }
          saving.value = false;
          menu.value = false;
          ctx.emit('save');
        });
      }
    };

    const tagsItemsWithoutNull = computed(() => {
      const [, ...rest] = props.tagsItems;
      return rest;
    });

    const videoTimeUpdated = (event: any) => {
      console.log(event.detail.plyr.currentTime);
      currentTime.value = Math.round(event.detail.plyr.currentTime);
    };

    const startSegment = () => {
      item.value.startTime = currentTime.value;
    };
    const endSegment = () => {
      item.value.endTime = currentTime.value;
    };

    onMounted(() => {
      waitForPlayerReady();
    });

    const waitForPlayerReady = () => new Promise<void>((resolve) => {
      const loop = () => {
        if (player.value && player.value.ready) {
          player.value.off('timeupdate');
          player.value.on('timeupdate', (event: any) => videoTimeUpdated(event));

          player.value.off('seeked');
          player.value.on('seeked', (event: any) => videoTimeUpdated(event));

          player.value.off('seeking');
          player.value.on('seeking', (event: any) => videoTimeUpdated(event));

          resolve();
        } else {
          setTimeout(() => loop(), 1000);
        }
      };
      loop();
    });

    const ensureGeneralTag = (_item: SongPlaylistInterface) => {
      if (_item.tags.length === 0) {
        _item.tags = ['general'];
      }
    };

    return {
      menu,
      item,
      save,
      translate,
      capitalize,
      valid,
      saving,
      form,
      tagsItemsWithoutNull,
      videoTimeUpdated,
      range,
      startSegment,
      endSegment,
      playerRef,
      ensureGeneralTag,
    };
  },
  head () {
    return {
      link: [
        {
          rel:  'stylesheet',
          href: 'https://unpkg.com/vue-plyr/dist/vue-plyr.css',
        },
      ],
    };
  },
});
</script>

<style>
.playlist-item-trim .v-input__prepend-outer .v-input, .playlist-item-trim .v-input__append-outer .v-input {
  padding-top: 0;
  margin-top: 0;
  min-width: 100px;
}
</style>
