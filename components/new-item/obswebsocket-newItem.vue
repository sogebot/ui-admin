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
                  :highlight="highlighter"
                />
              </div>
            </v-expand-transition>

            <v-expand-transition>
              <div v-if="!item.advancedMode">
                <v-card-title>{{ translate('integrations.obswebsocket.actions') }}</v-card-title>

                <v-row>
                  <v-btn />
                </v-row>
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
import { highlight, languages } from 'prismjs';
import shortid from 'shortid';
import { v4 } from 'uuid';
import { PrismEditor } from 'vue-prism-editor';
import 'vue-prism-editor/dist/prismeditor.min.css'; // import the styles somewhere

import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-tomorrow.css'; // import syntax highlighting styles

import { availableActions } from '.bot/src/bot/helpers/obswebsocket/actions';
import type { Source, Type } from '.bot/src/bot/helpers/obswebsocket/sources';
import { OBSWebsocketInterface } from '~/.bot/src/bot/database/entity/obswebsocket';
import api from '~/functions/api';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
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
    const highlighter = (code: string) => {
      return highlight(code, languages.js, 'javascript'); // returns html
    };
    const dialog = ref(
      (!props.activator && ctx.root.$route.query._action === 'create')
      || (props.activator && typeof ctx.root.$route.query._id !== 'undefined'),
    );
    const watcher = ref(true);

    const form1 = ref(null);
    const valid1 = ref(true);

    const isSaving = ref(false);
    const isLoading = ref(false);

    const item = ref(cloneDeep(props.editItem ? props.editItem : emptyItem) as OBSWebsocketInterface);

    const rules = { name: [required] };

    const availableScenes = ref([] as { value: string; text: string }[]);
    const availableSources = ref([] as Source[]);
    const sourceTypes = ref([] as Type[]);
    const availableAudioSources = computed(() => {
      const audioTypeId = sourceTypes.value.filter(type => type.caps.hasAudio).map(type => type.typeId);
      return availableSources.value
        .filter(source => audioTypeId.includes(source.typeId))
        .map(source => ({ value: source.name, text: source.name }));
    });

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
            console.log({ response });
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

    return {
      // refs
      dialog,
      isSaving,
      isLoading,
      closeDlg,
      form1,
      valid1,
      item,
      rules,

      availableScenes,
      availableSources,
      availableActions,
      availableAudioSources,
      sourceTypes,

      // functions
      save,
      highlighter,
      addAction,

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
