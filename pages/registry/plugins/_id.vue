<template>
  <div style="width: 100%; height: 100%;">
    <portal to="navbar">
      <v-btn
        small
        :text="!$vuetify.breakpoint.xs"
        :icon="$vuetify.breakpoint.xs"
        :loading="saving"
        :disabled="loading"
        @click="save"
      >
        <v-icon class="d-flex d-sm-none">
          mdi-floppy
        </v-icon>
        <span class="d-none d-sm-flex">{{ $t('dialog.buttons.saveChanges.idle') }}</span>
      </v-btn>
    </portal>

    <v-card style="position: fixed; right: 20px; top: 60px; z-index: 9999;">
      <v-sheet color="blue-grey darken-4">
        <v-card-text>
          <v-text-field
            v-model="item.name"
            outlined
            hide-details="auto"
            dense
            label="Name"
          />
          <v-switch
            v-model="item.enabled"
            :label="(item.enabled
              ? 'Plugin is enabled'
              : 'Plugin is disabled')"
          />
          <v-autocomplete
            v-model="selectedItem"
            class="pt-2"
            outlined
            dense
            :items="items"
            label="Item to add"
          >
            <template #append-outer>
              <v-btn icon style="transform: translateY(-7px);" @click="addItem">
                <v-icon color="white">
                  mdi-plus
                </v-icon>
              </v-btn>
            </template>
          </v-autocomplete>

          <PluginsImportDialog @import="importToEditor($event)" />
          <PluginsExportDialog />
        </v-card-text>
      </v-sheet>
    </v-card>
    <div id="drawflow" :key="item.id" style="width: 100%; height: 100%;" />
  </div>
</template>

<script lang="ts">
import type { Plugin } from '@entity/plugins';
import { getSocket } from '@sogebot/ui-helpers/socket';
import Drawflow from 'drawflow';
import Vue from 'vue';

import filter from '~/components/drawflow/filter';
import filterPermission from '~/components/drawflow/filter/permission';
import listener from '~/components/drawflow/listener';
import othersComment from '~/components/drawflow/others/comment';
import othersIdle from '~/components/drawflow/others/idle';
import outputLog from '~/components/drawflow/output/log';
import twitchBanUser from '~/components/drawflow/output/twitchBanUser';
import twitchSendMessage from '~/components/drawflow/output/twitchSendMessage';
import twitchTimeoutUser from '~/components/drawflow/output/twitchTimeoutUser';
import variableLoadFromDatabase from '~/components/drawflow/variable/loadFromDatabase';
import variableSaveToDatabase from '~/components/drawflow/variable/saveToDatabase';
import variableSetVariable from '~/components/drawflow/variable/setVariable';
import { EventBus } from '~/functions/event-bus';

export default defineComponent({
  setup (_, context) {
    const { $store } = useNuxtApp();
    const route = useRoute();

    let editor: Drawflow | null = null;

    const item = computed<Plugin>({
      get () {
        return $store.state.registryPlugins.item;
      },
      set (value) {
        // $store.commit('registryPlugins/set', value);
      },
    });

    const loading = ref(true);
    const saving = ref(false);

    const items = [
      { header: 'Input' },
      'listener',
      { header: 'Variables' },
      'variableSetVariable', 'variableLoadFromDatabase', 'variableSaveToDatabase',
      { header: 'Filters' },
      'filter', 'filterPermission',
      { header: 'Output' },
      'twitchSendMessage', 'twitchTimeoutUser', 'twitchBanUser', 'outputLog',
      { header: 'Other' },
      'comment', 'othersIdle',
    ];
    const selectedItem = ref('listener');

    const addItem = () => {
      switch (selectedItem.value) {
        case 'othersIdle':
          editor?.addNode('othersIdle', 1, 1, 100, 100, 'othersIdle', { value: '', data: '{}' }, 'othersIdle', 'vue');
          break;
        case 'comment':
          editor?.addNode('comment', 0, 0, 100, 100, 'comment', { value: '', data: '{}' }, 'comment', 'vue');
          break;
        case 'variableSetVariable':
          editor?.addNode('variableSetVariable', 1, 1, 100, 100, 'variableSetVariable', { value: '', data: '{}' }, 'variableSetVariable', 'vue');
          break;
        case 'variableLoadFromDatabase':
          editor?.addNode('variableLoadFromDatabase', 0, 1, 100, 100, 'variableLoadFromDatabase', { value: '', data: '{}' }, 'variableLoadFromDatabase', 'vue');
          break;
        case 'variableSaveToDatabase':
          editor?.addNode('variableSaveToDatabase', 1, 1, 100, 100, 'variableSaveToDatabase', { value: '', data: '{}' }, 'variableSaveToDatabase', 'vue');
          break;
        case 'listener':
          editor?.addNode('listener', 0, 1, 100, 100, 'listener', { value: '', data: '{}' }, 'listener', 'vue');
          break;
        case 'filter':
          editor?.addNode('filter', 1, 2, 100, 100, 'filter', { value: null }, 'filter', 'vue');
          break;
        case 'filterPermission':
          editor?.addNode('filterPermission', 1, 2, 100, 100, 'filterPermission', { value: ['0efd7b1c-e460-4167-8e06-8aaf2c170311'] }, 'filterPermission', 'vue');
          break;
        case 'twitchSendMessage':
          editor?.addNode('twitchSendMessage', 1, 1, 100, 100, 'twitchSendMessage', { value: '' }, 'twitchSendMessage', 'vue');
          break;
        case 'twitchTimeoutUser':
          editor?.addNode('twitchTimeoutUser', 1, 1, 100, 100, 'twitchTimeoutUser', { value: '' }, 'twitchTimeoutUser', 'vue');
          break;
        case 'twitchBanUser':
          editor?.addNode('twitchBanUser', 1, 1, 100, 100, 'twitchBanUser', { value: '' }, 'twitchBanUser', 'vue');
          break;
        case 'outputLog':
          editor?.addNode('outputLog', 1, 1, 100, 100, 'outputLog', { value: '' }, 'outputLog', 'vue');
          break;
        default:
      }

      $store.commit('registryPlugins/workflow', JSON.stringify(editor?.export()));
    };

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
            $store.commit('registryPlugins/set', d);
          }
          resolve(true);
        });
      });
    };

    // Pass render Vue
    onMounted(async () => {
      $store.commit('panel/back', '/registry/plugins');

      $store.commit('registryPlugins/set', {
        id:       route.params.id,
        name:     '',
        enabled:  true,
        workflow: '',
      });

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
              node, update, data,
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
        editor.registerNode('listener', listener, {}, {});
        editor.registerNode('filter', filter, {}, {});
        editor.registerNode('filterPermission', filterPermission, {}, {});
        editor.registerNode('twitchSendMessage', twitchSendMessage, {}, {});
        editor.registerNode('twitchTimeoutUser', twitchTimeoutUser, {}, {});
        editor.registerNode('twitchBanUser', twitchBanUser, {}, {});
        editor.registerNode('outputLog', outputLog, {}, {});
        editor.registerNode('variableSaveToDatabase', variableSaveToDatabase, {}, {});
        editor.registerNode('variableLoadFromDatabase', variableLoadFromDatabase, {}, {});
        editor.registerNode('variableSetVariable', variableSetVariable, {}, {});
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

      console.log('/core/plugins|generic::save', item.value);
      getSocket('/core/plugins').emit('generic::save', item.value, (err) => {
        saving.value = false;
        if (err) {
          return console.error(err);
        }
        EventBus.$emit('snack', 'success', 'Data saved.');
        $store.commit('settings/pending', false);
      });
    };

    const importToEditor = (workflow: string) => {
      editor?.import(workflow);
    };

    return {
      item,
      importToEditor,
      loading,
      saving,
      addItem,
      items,
      selectedItem,
      save,
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

.drawflow-node.filterPermission > .outputs > .output_1,
.drawflow-node.filter > .outputs > .output_1 {
  background-color: rgb(108 255 108);
}

.drawflow-node.filterPermission > .outputs > .output_2,
.drawflow-node.filter > .outputs > .output_2 {
  background-color: rgb(255 93 93);
}
</style>
