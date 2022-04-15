<template>
  <div style="width: 100%; height: 100%;">
    <v-card style="position: fixed; right: 100px; top: 100px; z-index: 9999;">
      <v-toolbar color="blue-grey darken-4" class="pt-4 pb-2">
        <v-autocomplete v-model="selectedItem" :items="items" label="Item to add" hide-details="true">
          <template #append-outer>
            <v-btn icon style="transform: translateY(-15px);" @click="addItem">
              <v-icon color="white">
                mdi-plus
              </v-icon>
            </v-btn>
          </template>
        </v-autocomplete>
      </v-toolbar>
    </v-card>
    <div id="drawflow" style="width: 100%; height: 100%;" />
  </div>
</template>

<script lang="ts">
import Drawflow from 'drawflow';
import Vue from 'vue';

import filter from '~/components/drawflow/filter';
import listener from '~/components/drawflow/listener';
import { EventBus } from '~/functions/event-bus';

export default defineComponent({
  // const dataToImport =  {"drawflow":{"Home":{"data":{"1":{"id":1,"name":"welcome","data":{},"class":"welcome","html":"\n    <div>\n      <div class=\"title-box\">👏 Welcome!!</div>\n      <div class=\"box\">\n        <p>Simple flow library <b>demo</b>\n        <a href=\"https://github.com/jerosoler/Drawflow\" target=\"_blank\">Drawflow</a> by <b>Jero Soler</b></p><br>\n\n        <p>Multiple input / outputs<br>\n           Data sync nodes<br>\n           Import / export<br>\n           Modules support<br>\n           Simple use<br>\n           Type: Fixed or Edit<br>\n           Events: view console<br>\n           Pure Javascript<br>\n        </p>\n        <br>\n        <p><b><u>Shortkeys:</u></b></p>\n        <p>🎹 <b>Delete</b> for remove selected<br>\n        💠 Mouse Left Click == Move<br>\n        ❌ Mouse Right == Delete Option<br>\n        🔍 Ctrl + Wheel == Zoom<br>\n        📱 Mobile support<br>\n        ...</p>\n      </div>\n    </div>\n    ", "typenode": false, "inputs":{},"outputs":{},"pos_x":50,"pos_y":50},"2":{"id":2,"name":"slack","data":{},"class":"slack","html":"\n          <div>\n            <div class=\"title-box\"><i class=\"fab fa-slack\"></i> Slack chat message</div>\n          </div>\n          ", "typenode": false, "inputs":{"input_1":{"connections":[{"node":"7","input":"output_1"}]}},"outputs":{},"pos_x":1028,"pos_y":87},"3":{"id":3,"name":"telegram","data":{"channel":"channel_2"},"class":"telegram","html":"\n          <div>\n            <div class=\"title-box\"><i class=\"fab fa-telegram-plane\"></i> Telegram bot</div>\n            <div class=\"box\">\n              <p>Send to telegram</p>\n              <p>select channel</p>\n              <select df-channel>\n                <option value=\"channel_1\">Channel 1</option>\n                <option value=\"channel_2\">Channel 2</option>\n                <option value=\"channel_3\">Channel 3</option>\n                <option value=\"channel_4\">Channel 4</option>\n              </select>\n            </div>\n          </div>\n          ", "typenode": false, "inputs":{"input_1":{"connections":[{"node":"7","input":"output_1"}]}},"outputs":{},"pos_x":1032,"pos_y":184},"4":{"id":4,"name":"email","data":{},"class":"email","html":"\n            <div>\n              <div class=\"title-box\"><i class=\"fas fa-at\"></i> Send Email </div>\n            </div>\n            ", "typenode": false, "inputs":{"input_1":{"connections":[{"node":"5","input":"output_1"}]}},"outputs":{},"pos_x":1033,"pos_y":439},"5":{"id":5,"name":"template","data":{"template":"Write your template"},"class":"template","html":"\n            <div>\n              <div class=\"title-box\"><i class=\"fas fa-code\"></i> Template</div>\n              <div class=\"box\">\n                Ger Vars\n                <textarea df-template></textarea>\n                Output template with vars\n              </div>\n            </div>\n            ", "typenode": false, "inputs":{"input_1":{"connections":[{"node":"6","input":"output_1"}]}},"outputs":{"output_1":{"connections":[{"node":"4","output":"input_1"},{"node":"11","output":"input_1"}]}},"pos_x":607,"pos_y":304},"6":{"id":6,"name":"github","data":{"name":"https://github.com/jerosoler/Drawflow"},"class":"github","html":"\n          <div>\n            <div class=\"title-box\"><i class=\"fab fa-github \"></i> Github Stars</div>\n            <div class=\"box\">\n              <p>Enter repository url</p>\n            <input type=\"text\" df-name>\n            </div>\n          </div>\n          ", "typenode": false, "inputs":{},"outputs":{"output_1":{"connections":[{"node":"5","output":"input_1"}]}},"pos_x":341,"pos_y":191},"7":{"id":7,"name":"facebook","data":{},"class":"facebook","html":"\n        <div>\n          <div class=\"title-box\"><i class=\"fab fa-facebook\"></i> Facebook Message</div>\n        </div>\n        ", "typenode": false, "inputs":{},"outputs":{"output_1":{"connections":[{"node":"2","output":"input_1"},{"node":"3","output":"input_1"},{"node":"11","output":"input_1"}]}},"pos_x":347,"pos_y":87},"11":{"id":11,"name":"log","data":{},"class":"log","html":"\n            <div>\n              <div class=\"title-box\"><i class=\"fas fa-file-signature\"></i> Save log file </div>\n            </div>\n            ", "typenode": false, "inputs":{"input_1":{"connections":[{"node":"5","input":"output_1"},{"node":"7","input":"output_1"}]}},"outputs":{},"pos_x":1031,"pos_y":363}}},"Other":{"data":{"8":{"id":8,"name":"personalized","data":{},"class":"personalized","html":"\n            <div>\n              Personalized\n            </div>\n            ", "typenode": false, "inputs":{"input_1":{"connections":[{"node":"12","input":"output_1"},{"node":"12","input":"output_2"},{"node":"12","input":"output_3"},{"node":"12","input":"output_4"}]}},"outputs":{"output_1":{"connections":[{"node":"9","output":"input_1"}]}},"pos_x":764,"pos_y":227},"9":{"id":9,"name":"dbclick","data":{"name":"Hello World!!"},"class":"dbclick","html":"\n            <div>\n            <div class=\"title-box\"><i class=\"fas fa-mouse\"></i> Db Click</div>\n              <div class=\"box dbclickbox\" ondblclick=\"showpopup(event)\">\n                Db Click here\n                <div class=\"modal\" style=\"display:none\">\n                  <div class=\"modal-content\">\n                    <span class=\"close\" onclick=\"closemodal(event)\">&times;</span>\n                    Change your variable {name} !\n                    <input type=\"text\" df-name>\n                  </div>\n\n                </div>\n              </div>\n            </div>\n            ", "typenode": false, "inputs":{"input_1":{"connections":[{"node":"8","input":"output_1"}]}},"outputs":{"output_1":{"connections":[{"node":"12","output":"input_2"}]}},"pos_x":209,"pos_y":38},"12":{"id":12,"name":"multiple","data":{},"class":"multiple","html":"\n            <div>\n              <div class=\"box\">\n                Multiple!\n              </div>\n            </div>\n            ", "typenode": false, "inputs":{"input_1":{"connections":[]},"input_2":{"connections":[{"node":"9","input":"output_1"}]},"input_3":{"connections":[]}},"outputs":{"output_1":{"connections":[{"node":"8","output":"input_1"}]},"output_2":{"connections":[{"node":"8","output":"input_1"}]},"output_3":{"connections":[{"node":"8","output":"input_1"}]},"output_4":{"connections":[{"node":"8","output":"input_1"}]}},"pos_x":179,"pos_y":272}}}}}
  setup (_, context) {
    const items = [
      'listener', 'filter',
    ];
    const selectedItem = ref('listener');

    const addItem = () => {
      switch (selectedItem.value) {
        case 'listener':
          editor?.addNode('listener', 0, 1, 100, 100, 'listener', { value: '' }, 'listener', 'vue');
          break;
        case 'filter':
          editor?.addNode('filter', 1, 2, 100, 100, 'filter', { value: '' }, 'filter', 'vue');
          break;
        default:
      }

      localStorage.plugins = JSON.stringify(editor?.export());
    };

    let editor: Drawflow | null = null;

    // Pass render Vue
    onMounted(() => {
      EventBus.$on('drawflow::getCommonParents', (id: string, cb: (attrs: any) => void) => {
        id = id.replace('node-', '');

        const parentNodes: any[] = [];
        const getParentNodeWithoutInputs = (childId: string | number) => {
          if (editor) {
            const originalNode = editor.getNodeFromId(childId);
            for (const key of Object.keys(originalNode.inputs)) {
              const connections = originalNode.inputs[key].connections;
              for (const connection of connections) {
                const childNode = editor.getNodeFromId(connection.node);
                if (Object.keys(childNode.inputs).length === 0) {
                  parentNodes.push(childNode);
                } else {
                  getParentNodeWithoutInputs(childNode.id);
                }
              }
            }
          }
        };
        getParentNodeWithoutInputs(id);
        cb(parentNodes);
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
              const item = node.outputs[outputs[0]];
              if (item.connections.length > 0) {
                editor?.removeSingleConnection(id, item.connections[0].node, `output_1`, (item.connections[0] as any).output);
              }
            }
          }
        }
        localStorage.plugins = JSON.stringify(editor?.export());
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
              const item = node.inputs[inputs[0]];
              if (item.connections.length > 0) {
                editor?.removeSingleConnection(item.connections[0].node, id, item.connections[0].input, `input_1`);
              }
            }
          }
        }
        localStorage.plugins = JSON.stringify(editor?.export());
      });
      EventBus.$on('drawflow::node::redraw', (id: string) => {
        console.log('Redraw', id)
        editor?.updateConnectionNodes(id);
      });
      EventBus.$on('drawflow::node::value', (id: string, cb: (value: any) => void) => {
        id = id.replace('node-', '');
        const node = editor?.getNodeFromId(id);
        console.log(`drawflow::node::value!!${id}`, { node });
        if (node !== undefined) {
          cb(node.data.value)
        } else {
          cb(null);
        }
      });
      EventBus.$on('drawflow::node::update', (id: string, update: Record<string, any>) => {
        id = id.replace('node-', '');
        const node = editor?.getNodeFromId(id);
        if (node !== undefined) {
          editor?.updateNodeDataFromId(id, { value: update });
          console.log(`drawflow::node::update!!${id}`, { node, update });
        }

        localStorage.plugins = JSON.stringify(editor?.export());
      });

      const id = document.getElementById('drawflow');
      if (id) {
        editor = new Drawflow(id, Vue, context.root);
        editor.draggable_inputs = false;
        editor.registerNode('listener', listener, {}, {});
        editor.registerNode('filter', filter, {}, {});
        editor.zoom_min = 0.3;
        editor.zoom_max = 1;

        editor.on('connectionCreated', () => {
          localStorage.plugins = JSON.stringify(editor?.export());
        });

        editor.on('connectionRemoved', () => {
          localStorage.plugins = JSON.stringify(editor?.export());
        });

        editor.on('nodeCreated', () => {
          localStorage.plugins = JSON.stringify(editor?.export());
        });

        editor.on('nodeMoved', () => {
          localStorage.plugins = JSON.stringify(editor?.export());
        });

        editor.on('nodeRemoved', (event) => {
          EventBus.$emit(`drawflow::nodeRemoved::node-${event}`);
          localStorage.plugins = JSON.stringify(editor?.export());
        });

        editor.on('nodeSelected', () => {
          localStorage.plugins = JSON.stringify(editor?.export());
        });

        editor.on('nodeUnselected', () => {
          localStorage.plugins = JSON.stringify(editor?.export());
        });


        editor.start();
        editor.zoom = 0.6;
        editor.zoom_refresh();

        try {
          if (localStorage.plugins) {
            editor.import(JSON.parse(localStorage.plugins));
          }
        } catch (err) {
          console.error(err);
          console.log('Invalid Data');
        }
      }
    });

    return {
      addItem,
      items,
      selectedItem,
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

.drawflow-node.filter > .outputs > .output_1 {
  background-color: rgb(108 255 108);
}

.drawflow-node.filter > .outputs > .output_2 {
  background-color: rgb(255 93 93);
}
</style>
