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

          <prism-editor
            v-model="item.code"
            style="border: 1px solid gray;"
            line-numbers
            :tab-size="4"
            :highlight="highlighterJS"
          />
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
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { cloneDeep } from 'lodash';
// import highlighting library (you can use any library you want just return html string)
import shortid from 'shortid';
import { v4 } from 'uuid';

import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { highlighterJS, PrismEditor } from '~/functions/prismjs';
import {
  required,
} from '~/functions/validators';

const emptyItem: OBSWebsocketInterface = {
  id:   '',
  name: '',
  code: '',
};
const router = useRouter();
const route = useRoute();

const { $store } = useNuxtApp();

const loading = ref(true);
const saving = ref(false);
const testing = ref(false);
const item = ref(cloneDeep(emptyItem) as OBSWebsocketInterface);

const logs = ref('');

const refetch = () => {
  if (route.params.id !== 'new') {
    getSocket('/').emit('integration::obswebsocket::generic::getOne', route.params.id, (err, data) => {
      if (err) {
        error(err);
      } else {
        if (!data) {
          EventBus.$emit('snack', 'error', 'Data not found.');
          router.push({ path: '/registry/obswebsocket' });
        } else {
          item.value = cloneDeep(data);
        }
        loading.value = false;
      }
    });
  } else {
    loading.value = false;
  }
};

const form1 = ref(null);
const valid1 = ref(true);

const rules = { name: [required] };

onMounted(() => {
  refetch();
  $store.commit('panel/back', '/registry/obswebsocket');

  getSocket('/').on('integration::obswebsocket::log', (toLog) => {
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
    // fetch default code
    fetch((process.env.isNuxtDev ? 'http://localhost:20000/' : '/') + 'assets/obswebsocket-code.txt')
      .then(response => response.text())
      .then((data) => {
        item.value = cloneDeep({
          ...emptyItem,
          id:   shortid.generate(),
          code: data,
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
    getSocket('/').emit('integration::obswebsocket::generic::save', {
      ...item.value,
      id: item.value.id ?? v4(),
    }, (err, data) => {
      if (err) {
        error(err);
      } else {
        router.push({ params: { id: data!.id } });
        EventBus.$emit('snack', 'success', 'Data saved.');
      }
      saving.value = false;
    });
  }
};

const test = () => {
  logs.value = '';
  testing.value = true;
  getSocket('/').emit('integration::obswebsocket::trigger', { code: item.value.code }, (err) => {
    if (err) {
      console.error({err})
      EventBus.$emit('snack', 'error', 'Something went wrong. Check the logs.');
    } else {
      EventBus.$emit('snack', 'success', 'Test done!');
    }
    testing.value = false;
  });
};
</script>
