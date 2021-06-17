<template>
  <v-card :loading="isLoading" class="fill-height">
    <v-toolbar v-if="!$vuetify.breakpoint.mobile" dense color="dark" style="z-index: 999;">
      <span class="headline">{{ translate('menu.permissions') }}</span>
    </v-toolbar>

    <v-overlay v-if="isLoading" absolute>
      <v-row>
        <v-col class="text-center">
          <v-progress-circular indeterminate size="48" />
        </v-col>
      </v-row>
    </v-overlay>
    <v-container v-else fluid>
      <v-row dense class="pt-2">
        <v-col cols="auto">
          <v-card>
            <v-toolbar dense color="blue-grey darken-4">
              <v-toolbar-title class="text-button">
                {{ translate('core.permissions.permissionsGroups') }}
              </v-toolbar-title>
              <v-spacer />
              <v-btn icon :loading="isCreating" @click="addNewPermissionGroup">
                <v-icon>{{ mdiPlus }}</v-icon>
              </v-btn>
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
    </v-container>
  </v-card>
</template>

<script lang="ts">
import {
  mdiCog, mdiEqual, mdiGreaterThanOrEqual, mdiPlus,
} from '@mdi/js';
import { defaultPermissions } from '@sogebot/ui-helpers/permissions/defaultPermissions';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';
import { sortBy } from 'lodash';
import { v4 } from 'uuid';

import type { PermissionsInterface } from '~/.bot/src/bot/database/entity/permissions';
import api from '~/functions/api';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';

export default defineComponent({
  setup (_, ctx) {
    const isLoading = ref(true);
    const isCreating = ref(false);
    const tab = ref(0);
    const permissions = ref([] as PermissionsInterface[]);

    watch(() => ctx.root.$route.params.id, (val?: string) => {
      if (!val && !isLoading.value) {
        refresh();
      }
    });

    onMounted(() => {
      refresh();
      EventBus
        .$off('settings::permissions::refresh')
        .$on('settings::permissions::refresh', refresh);
    });

    const refresh = () => {
      api.get<PermissionsInterface[]>(ctx.root.$axios, '/api/v1/settings/permissions')
        .then((response) => {
          permissions.value = response.data.data;
          isLoading.value = false;

          if (!ctx.root.$route.params.id) {
            ctx.root.$router.replace('/settings/permissions/' + permissions.value[0].id);
          }
        });
    };

    const reorder = () => {
      isCreating.value = true;
      // update orders
      const permissionsToReorder = sortBy(permissions.value.filter(o => o.id !== defaultPermissions.VIEWERS, 'order'));
      for (let i = 0; i < permissionsToReorder.length; i++) {
        permissionsToReorder[i].order = i;
      }
      const viewers = permissions.value.find(o => o.id === defaultPermissions.VIEWERS);
      if (viewers) {
        viewers.order = permissions.value.length - 1;
      }
      for (const permission of permissions.value) {
        api.patch(ctx.root.$axios, '/api/v1/settings/permissions/' + permission.id, permission)
          .then(() => {
            EventBus.$emit('settings::permissions::refresh');
          })
          .catch((e) => {
            error(e);
          })
          .finally(() => {
            isCreating.value = false;
            refresh();
          });
      }
    };
    const addNewPermissionGroup = () => {
      isCreating.value = true;
      const id = v4();
      const data: PermissionsInterface = {
        id,
        name:               '',
        isCorePermission:   false,
        isWaterfallAllowed: true,
        automation:         'none',
        order:              permissions.value.length - 1,
        userIds:            [],
        excludeUserIds:     [],
        filters:            [],
      };
      api.post(ctx.root.$axios, '/api/v1/settings/permissions', data)
        .then(() => {
          permissions.value.push(data);
          isCreating.value = false;
          reorder();
        });
    };

    return {
      // refs
      isLoading,
      isCreating,
      permissions,
      tab,

      // functions
      addNewPermissionGroup,

      // others
      translate,

      // icons
      mdiGreaterThanOrEqual,
      mdiEqual,
      mdiCog,
      mdiPlus,
    };
  },
});
</script>
