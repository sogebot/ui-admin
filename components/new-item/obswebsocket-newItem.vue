<template>
  <v-dialog v-model="dialog" fullscreen>
    <template v-if="activator" #activator="{ on, attrs }">
      <slot v-bind="attrs" v-on="on">
        <v-btn color="primary" v-bind="attrs" v-on="on">
          New Item
        </v-btn>
      </slot>
    </template>

    <v-card :loading="isLoading">
      <v-toolbar dense color="dark" style="z-index: 9999;">
        <v-btn icon @click="dialog = false">
          <v-icon>{{ mdiClose }}</v-icon>
        </v-btn>
        <span v-if="!$route.query._id" class="headline">New Item</span>
        <span v-else class="headline">Edit Item</span>
        <v-spacer />
        <v-btn text :loading="isTesting" :disabled="!valid1" @click="test">
          {{ translate('dialog.buttons.test.idle') }}
        </v-btn>
        <v-btn text :loading="isSaving" :disabled="!valid1" @click="save">
          {{ translate('dialog.buttons.saveChanges.idle') }}
        </v-btn>
      </v-toolbar>

      <v-overlay :value="isLoading" dark absolute>
        <v-row>
          <v-col class="text-center">
            <v-progress-circular indeterminate size="48" />
          </v-col>
        </v-row>
      </v-overlay>

      <v-fade-transition>
        <div v-if="!isLoading" class="pa-4">
          <v-form ref="form1" v-model="valid1" lazy-validation>
            <v-text-field
              v-model="item.name"
              :rules="rules.name"
              :label="translate('integrations.obswebsocket.name.name')"
            />

            <v-checkbox
              v-model="item.advancedMode"
              :label="translate('registry.alerts.enableAdvancedMode')"
            />

            <v-expand-transition>
              <div v-if="item.advancedMode">
                <prism-editor
                  v-model="item.advancedModeCode"
                  style="border: 1px solid gray;"
                  line-numbers
                  :tab-size="4"
                  :highlight="highlighterJS"
                />
              </div>
            </v-expand-transition>

            <v-expand-transition>
              <div v-if="!item.advancedMode">
                <v-card-title>{{ translate('integrations.obswebsocket.actions') }}</v-card-title>
                <v-card-text>
                  <v-row
                    v-for="(task, index) of item.simpleModeTasks"
                    :key="task.id"
                    class="p-2"
                  >
                    <v-col v-if="task.event === 'SetCurrentScene'">
                      <v-row align="end">
                        <v-col>
                          <v-select
                            v-model="task.args.sceneName"
                            :label="translate('integrations.obswebsocket.SetCurrentScene.name')"
                            :items="availableScenes"
                            hide-details
                          >
                            <template #append-outer>
                              <v-btn
                                color="error"
                                small
                                @click="deleteAction(index)"
                              >
                                {{ translate('dialog.buttons.delete') }}
                              </v-btn>
                            </template>
                          </v-select>
                        </v-col>
                      </v-row>
                    </v-col>

                    <v-col v-else-if="task.event === 'Log'">
                      <v-row align="end">
                        <v-col>
                          <v-text-field
                            v-model="task.args.logMessage"
                            :label="translate('integrations.obswebsocket.Log.name')"
                            hide-details
                          >
                            <template #append-outer>
                              <v-btn
                                color="error"
                                small
                                @click="deleteAction(index)"
                              >
                                {{ translate('dialog.buttons.delete') }}
                              </v-btn>
                            </template>
                          </v-text-field>
                        </v-col>
                      </v-row>
                    </v-col>

                    <v-col v-else-if="task.event === 'WaitMs'">
                      <v-row align="end">
                        <v-col>
                          <v-text-field
                            v-model="task.args.miliseconds"
                            :label="translate('integrations.obswebsocket.WaitMs.name')"
                            type="number"
                            min="0"
                            hide-details
                          >
                            <template #append-outer>
                              <v-btn
                                color="error"
                                small
                                @click="deleteAction(index)"
                              >
                                {{ translate('dialog.buttons.delete') }}
                              </v-btn>
                            </template>
                          </v-text-field>
                        </v-col>
                      </v-row>
                    </v-col>

                    <v-col
                      v-else-if="
                        [ 'StartReplayBuffer', 'StopReplayBuffer', 'SaveReplayBuffer',
                          'StartRecording', 'StopRecording', 'PauseRecording', 'ResumeRecording' ].includes(task.event)"
                      class="pa-0"
                    >
                      <v-row no-gutters align="center">
                        <v-col>
                          <v-subheader>{{ translate('integrations.obswebsocket.' + task.event + '.name') }}</v-subheader>
                        </v-col>
                        <v-col cols="auto" class="pr-3">
                          <v-btn
                            color="error"
                            small
                            @click="deleteAction(index)"
                          >
                            {{ translate('dialog.buttons.delete') }}
                          </v-btn>
                        </v-col>
                      </v-row>
                    </v-col>

                    <v-col v-else-if="task.event === 'SetMute'">
                      <v-row align="end">
                        <v-col>
                          <v-select
                            v-model="task.args.source"
                            :label="translate('integrations.obswebsocket.SetMute.name')"
                            :items="availableAudioSources"
                            hide-details
                          >
                            <template #append-outer>
                              <v-btn
                                :color="task.args.mute ? 'error' : 'success'"
                                small
                                class="mr-2"
                                @click="task.args.mute = !task.args.mute"
                              >
                                {{ translate('integrations.obswebsocket.' + (task.args.mute ? 'mute' : 'unmute')) }}
                              </v-btn>

                              <v-btn
                                color="error"
                                small
                                @click="deleteAction(index)"
                              >
                                {{ translate('dialog.buttons.delete') }}
                              </v-btn>
                            </template>
                          </v-select>
                        </v-col>
                      </v-row>
                    </v-col>

                    <v-col v-else-if="task.event === 'SetVolume'">
                      <v-row align="end">
                        <v-col>
                          <v-select
                            v-model="task.args.source"
                            :label="translate('integrations.obswebsocket.SetVolume.name')"
                            :items="availableAudioSources"
                            hide-details
                          />
                        </v-col>
                        <v-col>
                          <v-text-field
                            v-model.number="task.args.volume"
                            type="number"
                            min="-100"
                            max="0"
                            step="0.1"
                            class="mr-2"
                            small
                            hide-details
                          >
                            <template #append>
                              dB
                            </template>
                            <template #append-outer>
                              <v-btn
                                color="error"
                                small
                                @click="deleteAction(index)"
                              >
                                {{ translate('dialog.buttons.delete') }}
                              </v-btn>
                            </template>
                          </v-text-field>
                        </v-col>
                      </v-row>
                    </v-col>

                    <v-col
                      v-else
                      class="pa-0"
                    >
                      <v-row no-gutters align="center">
                        <v-col>
                          <v-subheader>Unknown task <em>{{ task.event }}</em></v-subheader>
                        </v-col>
                        <v-col cols="auto" class="pr-3">
                          <v-btn
                            color="error"
                            small
                            @click="deleteAction(index)"
                          >
                            {{ translate('dialog.buttons.delete') }}
                          </v-btn>
                        </v-col>
                      </v-row>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="auto">
                      <v-autocomplete
                        v-model="actionToAdd"
                        :items="Object.keys(availableActions).map(o => ({
                          value: o, text: translate('integrations.obswebsocket.' + o + '.name')
                        }))"
                        label="Select action to add"
                      >
                        <template #append-outer>
                          <v-btn icon @click="addAction(actionToAdd)">
                            <v-icon>{{ mdiPlus }}</v-icon>
                          </v-btn>
                        </template>
                      </v-autocomplete>
                    </v-col>
                  </v-row>
                </v-card-text>
              </div>
            </v-expand-transition>
          </v-form>
        </div>
      </v-fade-transition>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import {
  mdiClose, mdiExclamationThick, mdiPlus,
} from '@mdi/js';
import translate from '@sogebot/ui-helpers/translate';
import {
  computed,
  defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';
import { cloneDeep } from 'lodash-es';
// import highlighting library (you can use any library you want just return html string)
import ObsWebSocket from 'obs-websocket-js';
import shortid from 'shortid';
import { v4 } from 'uuid';

import { OBSWebsocketInterface } from '~/.bot/src/bot/database/entity/obswebsocket';
import { availableActions } from '~/.bot/src/bot/helpers/obswebsocket/actions';
import type { Source, Type } from '~/.bot/src/bot/helpers/obswebsocket/sources';
import api from '~/functions/api';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { highlighterJS, PrismEditor } from '~/functions/prismjs';
import { required } from '~/functions/validators';

type Props = {
  editItem?: OBSWebsocketInterface, activator: boolean
};

const emptyItem: OBSWebsocketInterface = {
  id:               '',
  name:             '',
  advancedMode:     false,
  advancedModeCode: '',
  simpleModeTasks:  [],
};

export default defineComponent({
  components: { PrismEditor },
  props:      { editItem: Object, activator: Boolean },
  setup (props: Props, ctx) {
    const dialog = ref(
      (!props.activator && ctx.root.$route.query._action === 'create')
      || (props.activator && typeof ctx.root.$route.query._id !== 'undefined'),
    );
    const watcher = ref(true);

    const form1 = ref(null);
    const valid1 = ref(true);

    const isSaving = ref(false);
    const isTesting = ref(false);
    const isLoading = ref(false);

    const item = ref(cloneDeep(props.editItem ? props.editItem : emptyItem) as OBSWebsocketInterface);

    const rules = { name: [required] };

    const availableScenes = ref([] as { value: string; text: string }[]);
    const availableSources = ref([] as Source[]);
    const sourceTypes = ref([] as Type[]);
    const availableAudioSources = computed(() => {
      const audioTypeId = sourceTypes.value.filter(type => type.caps.hasAudio).map(type => type.typeId);
      return [
        { value: '', text: translate('integrations.obswebsocket.noSourceSelected') },
        ...availableSources.value
          .filter(source => audioTypeId.includes(source.typeId))
          .map(source => ({ value: source.name, text: source.name }))];
    });
    const actionToAdd = ref(Object.keys(availableActions)[0]);

    watch(dialog, (val) => {
      if (!watcher.value) {
        watcher.value = true;
        return;
      }
      if (val && props.activator) {
        ctx.root.$router.push({ query: { _action: 'create' } });
      } else {
        ctx.root.$router.push({ query: {} });
      }
    });

    watch(() => ctx.root.$route, (val) => {
      watcher.value = false;
      if (val.query._id && !props.activator) {
        dialog.value = true;
        initial();
      } else if (val.query._action === 'create' && props.activator) {
        dialog.value = true;
        initial();
      } else {
        dialog.value = false;
      }
      ctx.root.$nextTick(() => {
        watcher.value = true;
      });
    });

    onMounted(() => {
      if (!props.activator) {
        // eventbus to activate dialog
        EventBus.$on('integrations::obswebsocket::updateDlgShow', (updateItem: OBSWebsocketInterface) => {
          ctx.root.$nextTick(() => {
            ctx.root.$router.push({ query: { _id: updateItem.id ?? '' } });
          });
        });
      }
      initial();
    });

    const initial = () => {
      refreshScenes();
      refreshSources();

      if (ctx.root.$route.query._id) {
        // load initial item
        isLoading.value = true;
        api.getOne<OBSWebsocketInterface>(ctx.root.$axios, `/api/v1/integration/obswebsocket`, String(ctx.root.$route.query._id) ?? '')
          .then((response) => {
            item.value = response.data;
            isLoading.value = false;
          })
          .catch(() => {
            dialog.value = false;
            ctx.root.$router.push({ query: {} });
            EventBus.$emit('snack', 'error', 'Data not found.');
          });
      }

      if (ctx.root.$route.query._action === 'create') {
        isLoading.value = true;
        // fetch default advancedModeCode
        fetch((process.env.isNuxtDev ? 'http://localhost:20000/' : '/') + 'assets/obswebsocket-code.txt')
          .then(response => response.text())
          .then((data) => {
            item.value = cloneDeep({
              ...emptyItem,
              id:               shortid.generate(),
              advancedModeCode: data,
            });
            isLoading.value = false;
          })
          .catch((e) => {
            error(e);
          });
      }
    };

    const save = () => {
      if (
        (form1.value as unknown as HTMLFormElement).validate()
      ) {
        isSaving.value = true;
        api.patch(ctx.root.$axios, `/api/v1/integration/obswebsocket/${item.value.id ?? v4()}`, item.value)
          .then((response) => {
            ctx.root.$router.push({ query: { _id: response.id ?? '' } });
            EventBus.$emit('snack', 'success', 'Data saved.');
            EventBus.$emit('integrations::obswebsocket::refresh');
          })
          .catch((e) => {
            console.error(e.response.data);
            error(JSON.stringify(e.response.data));
          })
          .finally(() => (isSaving.value = false));
      }
    };

    const closeDlg = () => {
      ctx.emit('close');
    };

    const addActionRegex = /\(obs, (?<arguments>.*?)\)/;
    const addAction = (actionKey: keyof typeof availableActions) => {
      const match = addActionRegex.exec(availableActions[actionKey].toString());
      const argsList = match?.groups?.arguments.split(',').map(o => o.trim()) || [];
      const args = argsList.reduce((prev, cur) => {
        let value: number|string|boolean = '';
        switch (cur) {
          case 'miliseconds':
            value = 1000;
            break;
          case 'mute':
            value = false;
            break;
          case 'volume':
            value = 0;
            break;
          case 'useDecibel':
            value = true;
            break;
        }
        return { [cur]: value, ...prev };
      }, {});
      item.value.simpleModeTasks.push({
        id:    shortid.generate(),
        event: actionKey,
        args:  args as any,
      });
    };

    const refreshScenes = () => {
      api.get<ObsWebSocket.Scene[]>(ctx.root.$axios, '/api/v1/integration/obswebsocket/listScene')
        .then((response) => {
          availableScenes.value = [{ value: '', text: translate('integrations.obswebsocket.noSceneSelected') }, ...response.data.data.map((scene) => {
            return {
              value: scene.name,
              text:  scene.name,
            };
          })];
        });
    };

    const refreshSources = () => {
      api.get<{ sources: Source[], types: Type[] }>(ctx.root.$axios, '/api/v1/integration/obswebsocket/sources')
        .then((response) => {
          availableSources.value = response.data.data.sources;
          sourceTypes.value = response.data.data.types;
        });
    };

    const deleteAction = (idx: number) => {
      if (item.value) {
        item.value.simpleModeTasks.splice(idx, 1);
      }
    };

    const test = () => {
      isTesting.value = true;
      api.post(ctx.root.$axios, '/api/v1/integration/obswebsocket/trigger',
        item.value.advancedMode
          ? item.value.advancedModeCode
          : item.value.simpleModeTasks)
        .then(() => EventBus.$emit('snack', 'success', 'Test done!'))
        .catch(() => EventBus.$emit('snack', 'error', 'Something went wrong. Check the logs.'))
        .finally(() => (isTesting.value = false));
    };

    return {
      // refs
      dialog,
      isSaving,
      isTesting,
      isLoading,
      closeDlg,
      form1,
      valid1,
      item,
      rules,

      actionToAdd,
      availableScenes,
      availableSources,
      availableActions,
      availableAudioSources,
      sourceTypes,

      // functions
      save,
      highlighterJS,
      addAction,
      deleteAction,
      test,

      // others
      translate,

      // icons
      mdiClose,
      mdiPlus,
      mdiExclamationThick,
    };
  },
});
</script>
