<template>
  <v-card :loading="loading">
    <portal to="navbar">
      <v-btn text :loading="testing" :disabled="!valid1" @click="test">
        {{ translate('dialog.buttons.test.idle') }}
      </v-btn>
      <v-btn
        small
        :text="!$vuetify.breakpoint.xs"
        :icon="$vuetify.breakpoint.xs"
        :loading="isSaving"
        :disabled="!valid1"
        @click="save"
      >
        <v-icon class="d-flex d-sm-none">
          {{ mdiFloppy }}
        </v-icon>
        <span class="d-none d-sm-flex">{{ translate('dialog.buttons.saveChanges.idle') }}</span>
      </v-btn>
    </portal>

    <v-overlay :value="loading" dark absolute>
      <v-row>
        <v-col class="text-center">
          <v-progress-circular indeterminate size="48" />
        </v-col>
      </v-row>
    </v-overlay>

    <v-fade-transition>
      <div v-if="!loading" class="pa-4">
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
</template>

<script lang="ts">
import {
  mdiClose, mdiExclamationThick, mdiFloppy, mdiPlus,
} from '@mdi/js';
import {
  computed,
  defineComponent, onMounted, ref, useContext, useRoute, useRouter, useStore, watch,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';
import { useMutation, useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { cloneDeep } from 'lodash';
// import highlighting library (you can use any library you want just return html string)
import shortid from 'shortid';
import { v4 } from 'uuid';

import { OBSWebsocketInterface } from '~/.bot/src/database/entity/obswebsocket';
import { availableActions } from '~/.bot/src/helpers/obswebsocket/actions';
import type { Source, Type } from '~/.bot/src/helpers/obswebsocket/sources';
import api from '~/functions/api';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { highlighterJS, PrismEditor } from '~/functions/prismjs';
import { required } from '~/functions/validators';
import GET_ONE from '~/queries/obsWebsocket/getOne.gql';
import SCENES_AND_SOURCES from '~/queries/obsWebsocket/scenes.gql';

const emptyItem: OBSWebsocketInterface = {
  id:               '',
  name:             '',
  advancedMode:     false,
  advancedModeCode: '',
  simpleModeTasks:  [],
};

export default defineComponent({
  components: { PrismEditor },
  setup (_, ctx) {
    const route = useRoute();
    let loading = ref(true);

    if (route.value.params.id !== 'new') {
      const query = useQuery(GET_ONE, { id: route.value.params.id });
      query.onError(error);
      loading = query.loading;

      watch(query.result, (value) => {
        if (value) {
          if (value.OBSWebsocket.length === 0) {
            EventBus.$emit('snack', 'error', 'Data not found.');
            router.push({ path: '/registry/obswebsocket' });
          } else {
            item.value = value.OBSWebsocket[0];
          }
        }
      });
    }
    const { result: sceneResult } = useQuery(SCENES_AND_SOURCES, null, { pollInterval: 1000 });
    watch(sceneResult, (value) => {
      if (value) {
        availableScenes.value = [
          { value: '', text: translate('integrations.obswebsocket.noSceneSelected') },
          ...value.OBSWebsocketGetScenes.map((scene: { name: string }) => ({
            value: scene.name,
            text:  scene.name,
          })),
        ];
        availableSources.value = value.OBSWebsocketGetSources;
        sourceTypes.value = value.OBSWebsocketGetSourceTypes;
      }
    }, { deep: true });

    const { mutate: trigger, loading: testing, onDone: onDone1, onError: onError1 } = useMutation(gql`
      mutation OBSWebsocketTrigger($tasks: String!) {
        OBSWebsocketTrigger(tasks: $tasks)
      }`);
    onDone1(() => EventBus.$emit('snack', 'success', 'Test done!'));
    onError1(() => EventBus.$emit('snack', 'error', 'Something went wrong. Check the logs.'));

    const context = useContext();
    const store = useStore();
    const router = useRouter();

    const form1 = ref(null);
    const valid1 = ref(true);

    const isSaving = ref(false);

    const item = ref(cloneDeep(emptyItem) as OBSWebsocketInterface);

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

    onMounted(() => {
      store.commit('panel/back', '/registry/obswebsocket');
      initial();
    });

    const initial = () => {
      if (route.value.params.id === 'new') {
        loading.value = true;
        // fetch default advancedModeCode
        fetch((process.env.isNuxtDev ? 'http://localhost:20000/' : '/') + 'assets/obswebsocket-code.txt')
          .then(response => response.text())
          .then((data) => {
            item.value = cloneDeep({
              ...emptyItem,
              id:               shortid.generate(),
              advancedModeCode: data,
            });
            loading.value = false;
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
        api.patch(context.$axios, `/api/v1/integration/obswebsocket/${item.value.id ?? v4()}`, item.value)
          .then((response) => {
            router.push({ params: { id: response.id ?? '' } });
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

    const deleteAction = (idx: number) => {
      if (item.value) {
        item.value.simpleModeTasks.splice(idx, 1);
      }
    };

    const test = () => {
      trigger({
        tasks: JSON.stringify(item.value.advancedMode
          ? item.value.advancedModeCode
          : item.value.simpleModeTasks),
      });
    };

    return {
      // refs
      isSaving,
      testing,
      loading,
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
      mdiFloppy,
    };
  },
});
</script>
