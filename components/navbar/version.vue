<template>
  <span>
    <portal to="main">
      <v-snackbar
        v-model="updateSnackbar"
        absolute
        app
        right
        top
        style="z-index: 9999"
      >
        <h5>{{ translate('errors.new_update_available') }}</h5>
        <div
          class="text-caption"
          v-html="translate('errors.new_bot_version_available_at').replace(/\$version/gmi, update.version)"
        />

        <template #action="{ attrs }">
          <v-btn
            icon
            v-bind="attrs"
            @click="updateSnackbar = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
      </v-snackbar>
    </portal>
    <v-badge tile color="primary darken-1" :content="version"/>
  </span>
</template>

<script lang="ts">
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  computed, defineComponent, onMounted, reactive, ref,
} from '@vue/composition-api';

export default defineComponent({
  setup () {
    const version = ref('');
    const update: {
      version: null | string;
    } = reactive({
      version: null,
    });
    const updateSnackbar = computed({
      get: () => {
        return update.version !== null;
      },
      set (val) {
        if (val === false) {
          update.version = null;
        }
      },
    });

    onMounted(() => {
      getSocket('/').emit('version', async (recvVersion: string) => {
        version.value = recvVersion;

        const { response } = await new Promise<{ response: Record<string, any>}>((resolve) => {
          const request = new XMLHttpRequest();
          request.open('GET', 'https://api.github.com/repos/sogehige/sogebot/releases/latest', true);

          request.onload = function () {
            if (!(this.status >= 200 && this.status < 400)) {
              console.error('Error getting version from git', this.status, this.response);
            }
            resolve({
              response: JSON.parse(this.response),
            });
          };
          request.onerror = function () {
            console.error('Connection error to github');
            resolve({
              response: {
              },
            });
          };

          request.send();
        });
        const botVersion = recvVersion.replace('-SNAPSHOT', '').split('.').map(o => Number(o));
        const gitVersion = (response.tag_name as string).split('.').map(o => Number(o));
        console.debug({
          botVersion, gitVersion,
        });

        let isNewer = false;
        for (let index = 0; index < botVersion.length; index++) {
          if (botVersion[index] < gitVersion[index]) {
            isNewer = true;
            break;
          } else if (botVersion[index] === gitVersion[index]) {
            continue;
          } else {
            isNewer = false;
            break;
          }
        }

        if (isNewer) {
          update.version = gitVersion.join('.');
        }
      });
    });
    return {
      version,
      updateSnackbar,
      update,
      translate,
    };
  },
});
</script>
