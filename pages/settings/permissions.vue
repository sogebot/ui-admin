<template>
  <v-container
    fluid
    :class="{ 'pa-4': !$vuetify.breakpoint.mobile }"
  >
    <h2 v-if="!$vuetify.breakpoint.mobile">
      {{ translate('menu.permissions') }}
    </h2>

    <v-overlay v-if="isLoading" absolute>
      <v-row>
        <v-col class="text-center">
          <v-progress-circular indeterminate size="48" />
        </v-col>
      </v-row>
    </v-overlay>
    <template v-else>
      <v-row dense class="pt-2">
        <v-col cols="auto">
          <v-card>
            <v-toolbar dense>
              <v-toolbar-title>
                {{ translate('core.permissions.permissionsGroups') }}
              </v-toolbar-title>
            </v-toolbar>
            <v-card-text class="pa-0">
              <v-tabs v-model="tab" vertical>
                <v-tab v-for="permission of permissions" :key="permission.id" style="text-align: left; justify-content: normal; max-width: none;" nuxt :to="&quot;/settings/permissions/&quot; + permission.id">
                  <v-icon left small>
                    {{ permission.isWaterfallAllowed ? mdiGreaterThanOrEqual : mdiEqual }}
                  </v-icon>
                  <span :class="{ 'white--text': permission.isCorePermission }">{{ permission.name }}</span>
                  <template v-if="permission.automation">
                    <v-spacer />
                    <v-icon left small>
                      {{ mdiCog }}
                    </v-icon>
                    <small class="text-caption">{{ translate('core.permissions.' + permission.automation) }}</small>
                  </template>
                </v-tab>
              </v-tabs>
            </v-card-text>
          </v-card>
          <v-alert color="error" text>
            {{ translate('core.permissions.higherPermissionHaveAccessToLowerPermissions') }}
          </v-alert>
        </v-col>
        <v-col>
          <NuxtChild />
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script lang="ts">
import {
  mdiCog, mdiEqual, mdiGreaterThanOrEqual,
} from '@mdi/js';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, onMounted, ref,
} from '@vue/composition-api';

import type { PermissionsInterface } from '~/.bot/src/bot/database/entity/permissions';
import api from '~/functions/api';

export default defineComponent({
  setup (_, ctx) {
    const isLoading = ref(true);
    const tab = ref(0);
    const permissions = ref([] as PermissionsInterface[]);

    onMounted(() => {
      api.get<PermissionsInterface[]>(ctx.root.$axios, '/api/v1/settings/permissions')
        .then((response) => {
          permissions.value = response.data.data;
          isLoading.value = false;

          if (!ctx.root.$route.params.id) {
            ctx.root.$router.replace('/settings/permissions/' + permissions.value[0].id);
          }
        });
    });

    return {
      // refs
      isLoading,
      permissions,
      tab,

      // others
      translate,

      // icons
      mdiGreaterThanOrEqual,
      mdiEqual,
      mdiCog,
    };
  },
});
</script>
