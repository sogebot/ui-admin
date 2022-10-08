<template>
  <div v-if="$vuetify.breakpoint.mobile">
    <v-alert prominent color="info">
      Plugins can be editable only from desktop. Sorry for inconvenience.<br>
      <nuxt-link to="/registry/plugins">
        Go back to Plugin registry.
      </nuxt-link>
    </v-alert>
  </div>
  <div v-else style="width: 100%; height: 100%;">
    <portal to="navbar">
      <PluginsImportDialog @import="importToEditor($event)" />
      <PluginsExportDialog />
      <v-btn
        small
        :text="!$vuetify.breakpoint.xs"
        :icon="$vuetify.breakpoint.xs"
        :loading="saving"
        :disabled="loading || $store.state.registryPlugins.errors.length > 0"
        @click="save"
      >
        <v-icon class="d-flex d-sm-none">
          mdi-floppy
        </v-icon>
        <span class="d-none d-sm-flex">{{ $t('dialog.buttons.saveChanges.idle') }}</span>
      </v-btn>
    </portal>

    <v-card
      id="plugins-edit-card"
      :style="{
        position: 'fixed',
        top: '50px',
        zIndex: 1,
        height: '100%',
        width: '400px',
      }"
    >
      <v-sheet color="blue-grey darken-4" style="height: 100%;">
        <v-card-text>
          <v-form ref="form">
            <v-text-field
              v-model="item.name"
              outlined
              dense
              label="Name"
              :rules="[isValid('name')]"
            />
            <v-switch
              v-model="item.enabled"
              class="mt-0"
              :label="(item.enabled
                ? 'Plugin is enabled'
                : 'Plugin is disabled')"
            />

            <v-btn-toggle
              v-model="currentTab"
              mandatory
              class="mb-4"
              style="width: 50%;"
            >
              <v-btn block>
                Settings
              </v-btn>
              <v-btn block>
                Nodes
              </v-btn>
            </v-btn-toggle>

            <div v-if="currentTab === 0" id="plugins-edit-settings" style="background-color: transparent; overflow-y: auto;" :style="{ height: heightSettings }">
              <template v-if="!settingsEditMode">
                <div v-if="(item.settings || []).length === 0">
                  No settings for this plugin found.
                </div>

                <div v-for="(it, index) in (item.settings || [])" :key="index" class="pb-2">
                  <template v-if="it.type === 'array' && Array.isArray(it.currentValue)">
                    <v-banner single-line>
                      {{ capitalize(camel2title(it.name)) }}
                      <template #actions>
                        <v-btn icon @click="it.currentValue = [...it.currentValue, '']">
                          <v-icon>mdi-plus</v-icon>
                        </v-btn>
                      </template>
                    </v-banner>
                    <v-text-field
                      v-for="(_it, index) of it.currentValue"
                      :key="index"
                      v-model="it.currentValue[index]"
                      hide-details="auto"
                    >
                      <template #append>
                        <v-btn icon @click="it.currentValue = ([...it.currentValue]).filter((_, idx) => idx !== index)">
                          <v-icon>mdi-minus</v-icon>
                        </v-btn>
                      </template>
                    </v-text-field>
                    <div v-if="it.description.length > 0" class="v-text-field__details pt-2">
                      <div class="v-messages theme--dark">
                        <div class="v-messages__wrapper">
                          <div class="v-messages__message">
                            {{ it.description }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>
                  <v-text-field v-else v-model="it.currentValue" :label="capitalize(camel2title(it.name))" :hint="it.description" persistent-hint />
                </div>
              </template>
              <template v-else>
                <v-simple-table>
                  <tbody>
                    <tr
                      v-for="(it, index) in (item.settings || [])"
                      :key="index"
                    >
                      <td>{{ it.name }}</td>
                      <td>{{ it.type }}</td>
                      <td>
                        <v-dialog
                          max-width="600"
                        >
                          <template #activator="{ on, attrs }">
                            <v-btn
                              color="primary"
                              v-bind="attrs"
                              icon
                              v-on="on"
                            >
                              <v-icon>mdi-pencil</v-icon>
                            </v-btn>
                          </template>
                          <template #default="dialog">
                            <SettingsVariableInput v-model="(item.settings || [])[index]" btn-text="Remove variable" editation @close="() => dialog.value = false" @click="removeSettingsVariable(index)" />
                          </template>
                        </v-dialog>
                      </td>
                    </tr>
                  </tbody>
                </v-simple-table>
                <!--div v-for="(_i, index) in (item.settings || [])" :key="index">

                  <SettingsVariableInput v-model="(item.settings || [])[index]" @click="removeSettingsVariable(index)" btnText="Remove variable" editation />
                  <v-divider class="mb-2" />
                </div-->

                <v-btn block @click="addNewSettingsVariable">
                  Add new variable
                </v-btn>
              </template>
            </div>

            <div v-if="currentTab === 0" style="text-align: center;">
              <v-btn text :color="settingsEditMode ? 'primary': 'error'" @click="settingsEditMode = !settingsEditMode">
                {{ settingsEditMode ? 'Go back to normal mode' : 'Define settings (dev mode)' }}
              </v-btn>
            </div>

            <v-list v-if="currentTab === 1" id="plugins-edit-list" style="background-color: transparent; overflow: auto;" :style="{ height: heightList }">
              <template v-for="(item, index) of items">
                <v-subheader v-if="typeof item !== 'string'" :key="item.header">
                  {{ item.header }}
                </v-subheader>
                <v-list-item
                  v-else
                  :key="item"
                  draggable="true"
                  :data-node="item"
                  style="cursor: grab;"
                  @dragstart="drag($event)"
                >
                  {{ item }}
                </v-list-item>

                <v-divider
                  v-if="index < items.length - 1 && typeof items[index+1] === 'string' && typeof items[index] === 'string'"
                  :key="index"
                />
              </template>
            </v-list>
          </v-form>
        </v-card-text>
      </v-sheet>
    </v-card>
    <div id="drawflow" :key="item.id" style="width: 100%; height: 100%;" @drop="drop($event)" @dragover="allowDrop($event)" />
  </div>
</template>

<script lang="ts">
import type { Plugin } from '@entity/plugins';
import { isValidationError } from '@sogebot/backend/src/helpers/errors';
import { getSocket } from '@sogebot/ui-helpers/socket';
import Drawflow from 'drawflow';
import gsap from 'gsap';
import capitalize from 'lodash/capitalize';
import cloneDeep from 'lodash/cloneDeep';
import shortid from 'shortid';
import Vue from 'vue';

import cron from '~/components/drawflow/cron.vue';
import gateCounter from '~/components/drawflow/filter/counter.vue';
import debounce from '~/components/drawflow/filter/debounce.vue';
import filter from '~/components/drawflow/filter/filter.vue';
import filterPermission from '~/components/drawflow/filter/permission.vue';
import listener from '~/components/drawflow/listener.vue';
import clearCounter from '~/components/drawflow/others/clearCounter.vue';
import othersComment from '~/components/drawflow/others/comment.vue';
import othersIdle from '~/components/drawflow/others/idle.vue';
import updateCounter from '~/components/drawflow/others/updateCounter.vue';
import outputLog from '~/components/drawflow/output/log.vue';
import twitchBanUser from '~/components/drawflow/output/twitchBanUser.vue';
import twitchSendMessage from '~/components/drawflow/output/twitchSendMessage.vue';
import twitchTimeoutUser from '~/components/drawflow/output/twitchTimeoutUser.vue';
import overlaysEmoteExplosion from '~/components/drawflow/overlays/emoteExplosion.vue';
import overlaysEmoteFirework from '~/components/drawflow/overlays/emoteFirework.vue';
import variableLoadFromDatabase from '~/components/drawflow/variable/loadFromDatabase.vue';
import variableSaveToDatabase from '~/components/drawflow/variable/saveToDatabase.vue';
import variableSetCustomVariable from '~/components/drawflow/variable/setCustomVariable.vue';
import variableSetVariable from '~/components/drawflow/variable/setVariable.vue';
import { EventBus } from '~/functions/event-bus';
import SettingsVariableInput from '~/pages/registry/plugins/components/settingsVariableInput.vue';

const camel2title = (camelCase: string) => camelCase
  .replace(/([A-Z])/g, match => ` ${match}`)
  .replace(/^./, match => match.toUpperCase())
  .trim();

export default defineComponent({
  components: { SettingsVariableInput },
  setup (_, context) {
    const { $store } = useNuxtApp();
    const route = useRoute();
    const currentTab = ref(0);
    const settingsEditMode = ref(false);

    const removeSettingsVariable = (idx: number) => {
      item.value.settings = [...(item.value.settings || []).slice(0, idx), ...(item.value.settings || []).slice(idx + 1)];
    };

    const addNewSettingsVariable = () => {
      item.value.settings = [
        ...(item.value.settings || []),
        {
          name:         shortid(),
          currentValue: '',
          defaultValue: '',
          description:  '',
          type:         'string',
        },
      ];
    };
    watch(() => $store.state.navbarMiniVariant, (val) => {
      gsap.to('#plugins-edit-card', {
        left:     val ? 56 : 256,
        duration: 0.1,
        ease:     'none',
      });
    }, { immediate: true });
    let editor: Drawflow | null = null;
    const form = ref(null);
    const item = ref({
      ...cloneDeep($store.state.registryPlugins.empty),
      id: route.params.id ?? null,
    } as Plugin);
    const dirty = ref(false);
    watch(item, (val) => {
      $store.commit('registryPlugins/set', val);
      console.log('/core/plugins|generic::validate', val);
      if (dirty.value) {
        val.workflow = val.workflow = val.workflow.length === 0 ? '"{"drawflow":{"Home":{"data":{}}}}"' : val.workflow;
        getSocket('/core/plugins').emit('generic::validate', val, (err) => {
          $store.commit('registryPlugins/errors', isValidationError(err) ? err : []);
        });
      }
      dirty.value = true;
    }, { immediate: true, deep: true });
    const loading = ref(true);
    const saving = ref(false);
    const items = [
      { header: 'Input' },
      'listener',
      'cron',
      { header: 'Variables' },
      'variableSetVariable',
      'variableLoadFromDatabase',
      'variableSaveToDatabase',
      'variableSetCustomVariable',
      { header: 'Gates' },
      'filter',
      'filterPermission',
      'debounce',
      { header: 'Counter Gate' },
      'counter',
      'clearCounter',
      'updateCounter',
      { header: 'Output' },
      'twitchSendMessage',
      'twitchTimeoutUser',
      'twitchBanUser',
      'outputLog',
      { header: 'Other' },
      'comment',
      'othersIdle',
      { header: 'Overlay' },
      'overlaysEmoteFirework',
      'overlaysEmoteExplosion',
    ];
    const refresh = () => {
      return new Promise((resolve) => {
        getSocket('/core/plugins').emit('generic::getOne', item.value.id, (err, d) => {
          console.log('/core/plugins|generic::getOne', { err, d });
          loading.value = false;
          if (err) {
            resolve(false);
            return console.error(err);
          }
          if (d) {
            item.value = d;
          }
          resolve(true);
        });
      });
    };
    const heightSettings = ref('0px');
    const setSettingsHeight = () => {
      const elSettings = document.getElementById('plugins-edit-settings');
      if (!elSettings || elSettings.getBoundingClientRect().top === 0) {
        setTimeout(() => setSettingsHeight(), 10);
        return;
      }
      const height = document.getElementById('plugins-edit-card')?.getBoundingClientRect().height ?? 0;
      const newHeight = height - elSettings.getBoundingClientRect().top;
      heightSettings.value = `${newHeight - 40}px`;
    };
    const heightList = ref('0px');
    const setListHeight = () => {
      const list = document.getElementById('plugins-edit-list');
      if (!list || list.getBoundingClientRect().top === 0) {
        setTimeout(() => setListHeight(), 10);
        return;
      }
      const height = document.getElementById('plugins-edit-card')?.getBoundingClientRect().height ?? 0;
      const newHeight = height - list.getBoundingClientRect().top;
      heightList.value = `${newHeight - 10}px`;
    };

    // Pass render Vue
    onMounted(async () => {
      $store.commit('panel/back', '/registry/plugins');
      $store.commit('registryPlugins/set', {
        id:       route.params.id,
        name:     '',
        enabled:  true,
        workflow: '',
        settings: [],
      });
      setListHeight();
      setSettingsHeight();
      await refresh();
      initEditor();
      EventBus.$on('drawflow::getCommonParents', (id: string, cb: (err: any, inputNodes: any[], allNodes: any[]) => void) => {
        id = id.replace('node-', '');
        const parentNodes: any[] = [];
        const allNodes: any[] = [];
        const getParentNodeWithoutInputs = (childId: string | number) => {
          if (editor) {
            try {
              const originalNode = editor.getNodeFromId(childId);
              for (const key of Object.keys(originalNode.inputs)) {
                const connections = originalNode.inputs[key].connections;
                for (const connection of connections) {
                  const childNode = editor.getNodeFromId(connection.node);
                  allNodes.push(childNode);
                  if (Object.keys(childNode.inputs).length === 0) {
                    parentNodes.push(childNode);
                  } else {
                    getParentNodeWithoutInputs(childNode.id);
                  }
                }
              }
            } catch (e) {
              cb(e, [], []);
            }
          }
        };
        getParentNodeWithoutInputs(id);
        cb(null, parentNodes, allNodes);
      });
      EventBus.$on('drawflow::node::output', (id: string, value: '+' | '-') => {
        id = id.replace('node-', '');
        console.log(`drawflow::node::output!!${id}${value}`);
        const node = editor?.getNodeFromId(id);
        if (node) {
          if (value === '+') {
            editor?.addNodeOutput(id);
          } else {
            const outputs = Object.keys(node.outputs);
            if (outputs.length > 1) {
              editor?.removeNodeOutput(id, outputs[outputs.length - 1]);
            } else {
              const itemOutputs = node.outputs[outputs[0]];
              if (itemOutputs.connections.length > 0) {
                editor?.removeSingleConnection(id, itemOutputs.connections[0].node, `output_1`, (item.connections[0] as any).output);
              }
            }
          }
        }
        $store.commit('registryPlugins/workflow', JSON.stringify(editor?.export()));
      });
      EventBus.$on('drawflow::node::input', (id: string, value: '+' | '-') => {
        id = id.replace('node-', '');
        console.log(`drawflow::node::input!!${id}${value}`);
        const node = editor?.getNodeFromId(id);
        if (node) {
          if (value === '+') {
            editor?.addNodeInput(id);
          } else {
            const inputs = Object.keys(node.inputs);
            if (inputs.length > 1) {
              editor?.removeNodeInput(id, inputs[inputs.length - 1]);
            } else {
              const nodeInput = node.inputs[inputs[0]];
              if (nodeInput.connections.length > 0) {
                editor?.removeSingleConnection(nodeInput.connections[0].node, id, nodeInput.connections[0].input, `input_1`);
              }
            }
          }
        }
        $store.commit('registryPlugins/workflow', JSON.stringify(editor?.export()));
      });
      EventBus.$on('drawflow::node::value', (id: string, cb: (value: any, data: any) => void) => {
        id = id.replace('node-', '');
        try {
          const node = editor?.getNodeFromId(id);
          console.log(`drawflow::node::value!!${id}`, { node });
          if (typeof node !== 'undefined') {
            cb(node.data.value, node.data.data);
          } else {
            cb(null, null);
          }
        } catch (e) {
          console.debug(`Cannot get node ${id}`, e);
          cb(null, null);
        }
      });
      EventBus.$on('drawflow::node::update', (id: string, update: Record<string, any>, data: string | undefined) => {
        data ??= '{}';
        id = id.replace('node-', '');
        try {
          const node = editor?.getNodeFromId(id);
          if (typeof node !== 'undefined') {
            editor?.updateNodeDataFromId(id, { value: update, data });
            console.log(`drawflow::node::update!!${id}`, {
              node,
              update,
              data,
            });
          }
          $store.commit('registryPlugins/workflow', JSON.stringify(editor?.export()));
        } catch (e) {
          console.debug(`Cannot get node ${id}`, e);
        }
      });
    });
    const initEditor = () => {
      const id = document.getElementById('drawflow');
      if (id) {
        console.log('Editor initialized.');
        editor = new Drawflow(id, Vue, context.root);
        editor.draggable_inputs = false;
        editor.registerNode('cron', cron, {}, {});
        editor.registerNode('listener', listener, {}, {});
        editor.registerNode('filter', filter, {}, {});
        editor.registerNode('filterPermission', filterPermission, {}, {});
        editor.registerNode('debounce', debounce, {}, {});
        editor.registerNode('gateCounter', gateCounter, {}, {});
        editor.registerNode('clearCounter', clearCounter, {}, {});
        editor.registerNode('updateCounter', updateCounter, {}, {});
        editor.registerNode('overlaysEmoteFirework', overlaysEmoteFirework, {}, {});
        editor.registerNode('overlaysEmoteExplosion', overlaysEmoteExplosion, {}, {});
        editor.registerNode('twitchSendMessage', twitchSendMessage, {}, {});
        editor.registerNode('twitchTimeoutUser', twitchTimeoutUser, {}, {});
        editor.registerNode('twitchBanUser', twitchBanUser, {}, {});
        editor.registerNode('outputLog', outputLog, {}, {});
        editor.registerNode('variableSaveToDatabase', variableSaveToDatabase, {}, {});
        editor.registerNode('variableLoadFromDatabase', variableLoadFromDatabase, {}, {});
        editor.registerNode('variableSetVariable', variableSetVariable, {}, {});
        editor.registerNode('variableSetCustomVariable', variableSetCustomVariable, {}, {});
        editor.registerNode('comment', othersComment, {}, {});
        editor.registerNode('othersIdle', othersIdle, {}, {});
        editor.zoom_min = 0.3;
        editor.zoom_max = 1;
        editor.on('connectionCreated', () => {
          $store.commit('registryPlugins/workflow', JSON.stringify(editor?.export()));
        });
        editor.on('connectionRemoved', () => {
          $store.commit('registryPlugins/workflow', JSON.stringify(editor?.export()));
        });
        editor.on('nodeCreated', () => {
          $store.commit('registryPlugins/workflow', JSON.stringify(editor?.export()));
        });
        editor.on('nodeMoved', () => {
          $store.commit('registryPlugins/workflow', JSON.stringify(editor?.export()));
        });
        editor.on('nodeRemoved', (event) => {
          EventBus.$emit(`drawflow::nodeRemoved::node-${event}`);
          $store.commit('registryPlugins/workflow', JSON.stringify(editor?.export()));
        });
        editor.on('nodeSelected', () => {
          $store.commit('registryPlugins/workflow', JSON.stringify(editor?.export()));
        });
        editor.on('nodeUnselected', () => {
          $store.commit('registryPlugins/workflow', JSON.stringify(editor?.export()));
        });
        editor.on('import', () => {
          $store.commit('registryPlugins/workflow', JSON.stringify(editor?.export()));
          item.value.workflow = JSON.stringify(editor?.export());
        });
        editor.start();
        try {
          if (item.value.workflow.length > 0) {
            editor.import(JSON.parse(item.value.workflow));
          }
        } catch (err) {
          console.error(err);
          console.log('Invalid Data');
        }
        setInterval(() => {
          if (editor) {
            for (const i of Object.values(editor.export().drawflow.Home.data)) {
              editor.updateConnectionNodes(`node-${i.id}`);
            }
          }
        }, 100);
      } else {
        console.log('Editor not initialized yet.');
        setTimeout(() => initEditor(), 100);
      }
    };
    const save = () => {
      saving.value = true;
      item.value.workflow = item.value.workflow.length === 0 ? '"{"drawflow":{"Home":{"data":{}}}}"' : item.value.workflow;
      console.log('/core/plugins|generic::save', item.value);
      getSocket('/core/plugins').emit('generic::save', item.value, (err) => {
        saving.value = false;
        if (err) {
          $store.commit('registryPlugins/errors', isValidationError(err) ? err : []);
          if (isValidationError(err)) {
            EventBus.$emit('snack', 'error', 'Data are invalid.', err);
          } else {
            EventBus.$emit('snack', 'error', 'Unknown error during save, please try again.');
          }
          (form.value as unknown as HTMLFormElement).validate();
          return console.error(err);
        }
        EventBus.$emit('snack', 'success', 'Data saved.');
        $store.commit('settings/pending', false);
      });
    };
    const importToEditor = (data: { workflow: string, settings: any[] }) => {
      for (const it of (data.settings || [])) {
        it.currentValue = it.defaultValue; // reset to default values
      }
      item.value.settings = data.settings || [];
      editor?.import(data.workflow);
    };
    const isValid = (property: string) => {
      const error = $store.state.registryPlugins.errors.find(o => o.property === property);
      if (!error) {
        return true;
      }
      return capitalize(Object.values<any>(error.constraints)[0]); // return first error;
    };
    const drag = (ev: any) => {
      ev.dataTransfer.setData('node', ev.target.getAttribute('data-node'));
    };
    const drop = (ev: any) => {
      ev.preventDefault();
      const data = ev.dataTransfer.getData('node') ?? '';
      console.log({ data });
      addNodeToDrawFlow(data, ev.clientX, ev.clientY);
    };
    function addNodeToDrawFlow (name: string, posX: number, posY: number) {
      if (!editor) {
        return;
      }
      posX = posX * ((editor as any).precanvas.clientWidth / ((editor as any).precanvas.clientWidth * (editor as any).zoom)) - ((editor as any).precanvas.getBoundingClientRect().x * ((editor as any).precanvas.clientWidth / ((editor as any).precanvas.clientWidth * (editor as any).zoom)));
      posY = posY * ((editor as any).precanvas.clientHeight / ((editor as any).precanvas.clientHeight * (editor as any).zoom)) - ((editor as any).precanvas.getBoundingClientRect().y * ((editor as any).precanvas.clientHeight / ((editor as any).precanvas.clientHeight * (editor as any).zoom)));
      switch (name) {
        case 'othersIdle':
          editor?.addNode('othersIdle', 1, 1, posX, posY, 'othersIdle', { value: '', data: '{}' }, 'othersIdle', 'vue');
          break;
        case 'comment':
          editor?.addNode('comment', 0, 0, posX, posY, 'comment', { value: '', data: '{}' }, 'comment', 'vue');
          break;
        case 'variableSetVariable':
          editor?.addNode('variableSetVariable', 1, 1, posX, posY, 'variableSetVariable', { value: '', data: '{}' }, 'variableSetVariable', 'vue');
          break;
        case 'variableSetCustomVariable':
          editor?.addNode('variableSetCustomVariable', 1, 1, posX, posY, 'variableSetCustomVariable', { value: '', data: '{}' }, 'variableSetCustomVariable', 'vue');
          break;
        case 'variableLoadFromDatabase':
          editor?.addNode('variableLoadFromDatabase', 0, 1, posX, posY, 'variableLoadFromDatabase', { value: '', data: '{}' }, 'variableLoadFromDatabase', 'vue');
          break;
        case 'variableSaveToDatabase':
          editor?.addNode('variableSaveToDatabase', 1, 1, posX, posY, 'variableSaveToDatabase', { value: '', data: '{}' }, 'variableSaveToDatabase', 'vue');
          break;
        case 'cron':
          editor?.addNode('cron', 0, 1, posX, posY, 'cron', { value: '0 * * * * *', data: '{}' }, 'cron', 'vue');
          break;
        case 'listener':
          editor?.addNode('listener', 0, 1, posX, posY, 'listener', { value: '', data: '{}' }, 'listener', 'vue');
          break;
        case 'overlaysEmoteExplosion':
          editor?.addNode('overlaysEmoteExplosion', 1, 0, posX, posY, 'overlaysEmoteExplosion', { value: null, data: '{}' }, 'overlaysEmoteExplosion', 'vue');
          break;
        case 'overlaysEmoteFirework':
          editor?.addNode('overlaysEmoteFirework', 1, 0, posX, posY, 'overlaysEmoteFirework', { value: null, data: '{}' }, 'overlaysEmoteFirework', 'vue');
          break;
        case 'clearCounter':
          editor?.addNode('clearCounter', 1, 1, posX, posY, 'clearCounter', { value: null, data: '{}' }, 'clearCounter', 'vue');
          break;
        case 'updateCounter':
          editor?.addNode('updateCounter', 1, 1, posX, posY, 'updateCounter', { value: 0, data: '{}' }, 'updateCounter', 'vue');
          break;
        case 'counter':
          editor?.addNode('gateCounter', 1, 2, posX, posY, 'gateCounter', { value: null, data: '{}' }, 'gateCounter', 'vue');
          break;
        case 'filter':
          editor?.addNode('filter', 1, 2, posX, posY, 'filter', { value: null, data: '{}' }, 'filter', 'vue');
          break;
        case 'filterPermission':
          editor?.addNode('filterPermission', 1, 2, posX, posY, 'filterPermission', { value: ['0efd7b1c-e460-4167-8e06-8aaf2c170311'] }, 'filterPermission', 'vue');
          break;
        case 'debounce':
          editor?.addNode('debounce', 1, 2, posX, posY, 'debounce', { value: null, data: '{}' }, 'debounce', 'vue');
          break;
        case 'twitchSendMessage':
          editor?.addNode('twitchSendMessage', 1, 1, posX, posY, 'twitchSendMessage', { value: '' }, 'twitchSendMessage', 'vue');
          break;
        case 'twitchTimeoutUser':
          editor?.addNode('twitchTimeoutUser', 1, 1, posX, posY, 'twitchTimeoutUser', { value: '' }, 'twitchTimeoutUser', 'vue');
          break;
        case 'twitchBanUser':
          editor?.addNode('twitchBanUser', 1, 1, posX, posY, 'twitchBanUser', { value: '' }, 'twitchBanUser', 'vue');
          break;
        case 'outputLog':
          editor?.addNode('outputLog', 1, 1, posX, posY, 'outputLog', { value: '' }, 'outputLog', 'vue');
          break;
        default:
      }
      $store.commit('registryPlugins/workflow', JSON.stringify(editor?.export()));
    }
    function allowDrop (ev: any) {
      ev.preventDefault();
    }
    return {
      allowDrop,
      camel2title,
      drag,
      drop,
      capitalize,
      currentTab,
      heightList,
      heightSettings,
      settingsEditMode,
      addNewSettingsVariable,
      removeSettingsVariable,
      isValid,
      dirty,
      item,
      importToEditor,
      loading,
      saving,
      items,
      save,
      form,
    };
  },
});
</script>

<style>
.node {
  border-radius: 8px;
  border: 2px solid #494949;
  background-color: white;
  display: block;
  height: 60px;
  line-height: 40px;
  padding: 10px;
  margin: 10px 0;
  cursor: move;
}

#drawflow {
  width: 100%;
  height: 100%;
  text-align: initial;
  background: #2b2c30;
  background-size: 20px 20px;
  background-image: radial-gradient(#494949 1px, transparent 1px);
}

.drawflow .drawflow-node .outputs,
.drawflow .drawflow-node .inputs {
  align-self: center !important;
}

.drawflow .drawflow-node {
  background-color: var(--v-secondary-base) !important;
  padding: 0;
  margin: 0;
  width: fit-content !important;
  align-items: flex-start !important;
}

.drawflow .drawflow-node.selected {
  border-color: var(--v-info-base) !important;
}

.drawflow-node.clearCounter .outputs .output:nth-child(1)::before,
.drawflow-node.updateCounter .outputs .output:nth-child(1)::before {
  display: block;
  content: "Link to Counter";
  position: relative;
  color: white;
  top: 15px;
  right: 40px;
  width: max-content;
  font-weight: bold;
}

.drawflow-node.clearCounter > .outputs > .output_1,
.drawflow-node.updateCounter > .outputs > .output_1 {
  background-color: rgb(70 70 70);
  display: block;
  position: absolute;
  top: 50px;
  right: 50%;
}

.drawflow-node.updateCounter > .outputs > .output_1 {
  top: 155px;
}

.drawflow-node.gateCounter > .outputs > .output_1,
.drawflow-node.debounce > .outputs > .output_1,
.drawflow-node.filterPermission > .outputs > .output_1,
.drawflow-node.filter > .outputs > .output_1 {
  background-color: rgb(108 255 108);
}

.drawflow-node.gateCounter > .outputs > .output_2,
.drawflow-node.debounce > .outputs > .output_2,
.drawflow-node.filterPermission > .outputs > .output_2,
.drawflow-node.filter > .outputs > .output_2 {
  background-color: rgb(255 93 93);
}
</style>
