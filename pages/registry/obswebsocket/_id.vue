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
        :loading="saving"
        :disabled="!valid1"
        @click="save"
      >
        <v-icon class="d-flex d-sm-none">
          mdi-floppy
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
                          :rules="rules.scene"
                          hide-details="auto"
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
                          :rules="rules.scene"
                          hide-details="auto"
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
                          :rules="rules.miliseconds"
                          min="0"
                          hide-details="auto"
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
                          :rules="rules.scene"
                          :label="translate('integrations.obswebsocket.SetMute.name')"
                          :items="availableAudioSources"
                          hide-details="auto"
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
                          :rules="rules.scene"
                          hide-details="auto"
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
                          :rules="rules.volume"
                          hide-details="auto"
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
                          <v-icon>mdi-plus</v-icon>
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

    <v-fade-transition>
      <v-alert v-if="logs.length > 0" prominent text v-html="logs" />
    </v-fade-transition>
  </v-card>
</template>

<script setup lang="ts">
import { OBSWebsocketInterface } from '@entity/obswebsocket';
import { availableActions } from '@sogebot/backend/src/helpers/obswebsocket/actions';
import type { Source, Type } from '@sogebot/backend/src/helpers/obswebsocket/sources';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import gql from 'graphql-tag';
import { cloneDeep } from 'lodash';
// import highlighting library (you can use any library you want just return html string)
import shortid from 'shortid';
import { v4 } from 'uuid';

import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { highlighterJS, PrismEditor } from '~/functions/prismjs';
import {
  maxValue, minValue, required,
} from '~/functions/validators';
import GET_ONE from '~/queries/obsWebsocket/getOne.gql';
import SCENES_AND_SOURCES from '~/queries/obsWebsocket/scenes.gql';

const emptyItem: OBSWebsocketInterface = {
  id:               '',
  name:             '',
  advancedMode:     false,
  advancedModeCode: '',
  simpleModeTasks:  [],
};
const router = useRouter();
const route = useRoute();

const { $graphql, $store } = useNuxtApp();

const loading = ref(true);
const saving = ref(false);
const item = ref(cloneDeep(emptyItem) as OBSWebsocketInterface);

const logs = ref('');

if (route.params.id !== 'new') {
  $graphql.default.request(GET_ONE, { id: route.params.id }).then((query: { result: any; }) => {
    const value = query.result;

    if (value.length === 0) {
      EventBus.$emit('snack', 'error', 'Data not found.');
      router.push({ path: '/registry/obswebsocket' });
    } else {
      item.value = cloneDeep(value[0]);
    }
    loading.value = false;
  });
}

const refetch = async () => {
  const request = await $graphql.default.request(SCENES_AND_SOURCES);
  if (request) {
    availableScenes.value = [
      { value: '', text: translate('integrations.obswebsocket.noSceneSelected') },
      ...request.OBSWebsocketGetScenes.map((scene: { name: string }) => ({
        value: scene.name,
        text:  scene.name,
      })),
    ];
    availableSources.value = request.OBSWebsocketGetSources;
    sourceTypes.value = request.OBSWebsocketGetSourceTypes;
  }
  setTimeout(() => refetch(), 5000);
};

const form1 = ref(null);
const valid1 = ref(true);

const rules = {
  name:        [required],
  scene:       [required],
  volume:      [required, maxValue(0), minValue(-100)],
  miliseconds: [required, minValue(10)],
};

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
const actionToAdd = ref(Object.keys(availableActions)[0] as keyof typeof availableActions);

onMounted(() => {
  refetch();
  $store.commit('panel/back', '/registry/obswebsocket');

  getSocket('/integrations/obswebsocket').on('log', (toLog) => {
    if (logs.value.length > 0) {
      logs.value += '<br/>' + toLog;
    } else {
      logs.value = toLog;
    }
  });
  initial();
});

const initial = () => {
  if (route.params.id === 'new') {
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
    saving.value = true;
    $graphql.default.request(gql`
      mutation OBSWebsocketSave($data: String!) {
        OBSWebsocketSave(data: $data) { id }
      }`, {
      data: JSON.stringify({
        ...item.value,
        id: item.value.id ?? v4(),
      }),
    })
      .then((result: any) => {
        router.push({ params: { id: result.data.OBSWebsocketSave.id } });
        EventBus.$emit('snack', 'success', 'Data saved.');
      })
      .catch((e: any) => error(e))
      .finally(() => (saving.value = false));
  }
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
  logs.value = '';
  $graphql.default.request(gql`
      mutation OBSWebsocketTrigger($tasks: String!) {
        OBSWebsocketTrigger(tasks: $tasks)
      }`, {
    tasks: JSON.stringify(item.value.advancedMode
      ? item.value.advancedModeCode
      : item.value.simpleModeTasks),
  })
    .then(() => EventBus.$emit('snack', 'success', 'Test done!'))
    .catch(() => EventBus.$emit('snack', 'error', 'Something went wrong. Check the logs.'));
};
</script>
