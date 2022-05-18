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

    <v-card id="plugins-edit-card" style="position: fixed; top: 50px; z-index: 1; height: 100%; width: 300px;">
      <v-sheet color="blue-grey darken-4" style="height: 100%;">
        <v-card-text>
          <v-form ref="form">
            <v-text-field
              v-model="item.name"
              outlined
              hide-details="auto"
              dense
              label="Name"
              :rules="[isValid('name')]"
            />
            <v-switch
              v-model="item.enabled"
              :label="(item.enabled
                ? 'Plugin is enabled'
                : 'Plugin is disabled')"
            />

            <v-list id="plugins-edit-list" style="background-color: transparent; overflow: auto;">
              <template v-for="(item, index) of items">
                <v-subheader v-if="item.header" :key="item.header">
                  {{ item.header }}
                </v-subheader>
                <v-list-item v-else :key="item" draggable="true" @dragstart="drag($event)" :data-node="item" style="cursor: grab;">
                  {{ item }}
                </v-list-item>

                <v-divider
                  v-if="index < items.length - 1 && !items[index+1].header && !items[index].header"
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
import Vue from 'vue';

import filter from '~/components/drawflow/filter/filter';
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

    watch(() => $store.state.navbarMiniVariant, (val) => {
      gsap.to('#plugins-edit-card', {
        left: val ? 56 : 256, duration: 0.1, ease: 'none',
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
      { header: 'Variables' },
      'variableSetVariable', 'variableLoadFromDatabase', 'variableSaveToDatabase',
      { header: 'Filters' },
      'filter', 'filterPermission',
      { header: 'Output' },
      'twitchSendMessage', 'twitchTimeoutUser', 'twitchBanUser', 'outputLog',
      { header: 'Other' },
      'comment', 'othersIdle',
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

    // Pass render Vue
    onMounted(async () => {
      $store.commit('panel/back', '/registry/plugins');

      $store.commit('registryPlugins/set', {
        id:       route.params.id,
        name:     '',
        enabled:  true,
        workflow: '',
      });

      nextTick(() => {
        // set list height
        const height = document.getElementById('plugins-edit-card')?.getBoundingClientRect().height ?? 0;
        const list = document.getElementById('plugins-edit-list');
        if (list) {
          const newHeight = height - list.getBoundingClientRect().top;
          console.log({
            list, height, newHeight,
          });
          list.style.height = `${newHeight - 20}px`;
        }
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

    const importToEditor = (workflow: string) => {
      editor?.import(workflow);
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
      console.log({data})
      addNodeToDrawFlow(data, ev.clientX, ev.clientY);
    };

    function addNodeToDrawFlow (name: string, posX: number, posY: number) {
      if (!editor) {
        return;
      }
      posX = posX * (editor.precanvas.clientWidth / (editor.precanvas.clientWidth * editor.zoom)) - (editor.precanvas.getBoundingClientRect().x * (editor.precanvas.clientWidth / (editor.precanvas.clientWidth * editor.zoom)));
      posY = posY * (editor.precanvas.clientHeight / (editor.precanvas.clientHeight * editor.zoom)) - (editor.precanvas.getBoundingClientRect().y * (editor.precanvas.clientHeight / (editor.precanvas.clientHeight * editor.zoom)));

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
        case 'variableLoadFromDatabase':
          editor?.addNode('variableLoadFromDatabase', 0, 1, posX, posY, 'variableLoadFromDatabase', { value: '', data: '{}' }, 'variableLoadFromDatabase', 'vue');
          break;
        case 'variableSaveToDatabase':
          editor?.addNode('variableSaveToDatabase', 1, 1, posX, posY, 'variableSaveToDatabase', { value: '', data: '{}' }, 'variableSaveToDatabase', 'vue');
          break;
        case 'listener':
          editor?.addNode('listener', 0, 1, posX, posY, 'listener', { value: '', data: '{}' }, 'listener', 'vue');
          break;
        case 'filter':
          editor?.addNode('filter', 1, 2, posX, posY, 'filter', { value: null, data: '{}' }, 'filter', 'vue');
          break;
        case 'filterPermission':
          editor?.addNode('filterPermission', 1, 2, posX, posY, 'filterPermission', { value: ['0efd7b1c-e460-4167-8e06-8aaf2c170311'] }, 'filterPermission', 'vue');
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

    function allowDrop(ev: any) {
      ev.preventDefault();
    }

    return {
      allowDrop,
      drag,
      drop,

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

.drawflow-node.filterPermission > .outputs > .output_1,
.drawflow-node.filter > .outputs > .output_1 {
  background-color: rgb(108 255 108);
}

.drawflow-node.filterPermission > .outputs > .output_2,
.drawflow-node.filter > .outputs > .output_2 {
  background-color: rgb(255 93 93);
}
</style>
