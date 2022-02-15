<template>
  <v-card>
    <v-toolbar dense color="blue-grey darken-4">
      <v-toolbar-title class="text-button">
        {{ translate('core.permissions.settings') }}
      </v-toolbar-title>
    </v-toolbar>
    <v-card-text>
      <v-overlay v-if="!model" absolute>
        <v-row>
          <v-col class="text-center">
            <v-progress-circular indeterminate size="48" />
          </v-col>
        </v-row>
      </v-overlay>
      <template v-else>
        <v-form v-model="valid" lazy-validation>
          <v-text-field
            v-model="model.name"
            :label="translate('core.permissions.name')"
            :rules="[required]"
          />

          <v-select
            v-if="!model.isCorePermission"
            v-model="model.automation"
            :label="translate('core.permissions.baseUsersSet')"
            :items="automationItems"
          />

          <v-checkbox
            v-if="!model.isCorePermission"
            v-model="model.isWaterfallAllowed"
            :label="translate('core.permissions.allowHigherPermissions')"
          />

          <userslist
            v-if="!model.isCorePermission"
            v-model="model.userIds"
            :label="translate('core.permissions.manuallyAddedUsers')"
          />

          <userslist
            v-if="!model.isCorePermission"
            v-model="model.excludeUserIds"
            :label="translate('core.permissions.manuallyExcludedUsers')"
          />

          <filters
            v-if="!model.isCorePermission"
            v-model="model.filters"
          />

          <test :permission="model.id" />
        </v-form>
      </template>
    </v-card-text>

    <v-card-actions v-if="model && !model.isCorePermission">
      <v-btn color="error" :loading="removing" @click="remove(model.id)">
        {{ translate('delete') }}
      </v-btn>
      <v-spacer />
      <v-btn
        :text="!$vuetify.breakpoint.xs"
        :icon="$vuetify.breakpoint.xs"
        :loading="saving"
        :disabled="!valid"
        @click="save"
      >
        <v-icon class="d-flex d-sm-none">
          mdi-floppy
        </v-icon>
        <span class="d-none d-sm-flex">{{ translate('dialog.buttons.saveChanges.idle') }}</span>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import {
  defineAsyncComponent, defineComponent,
  ref, useRoute, useRouter, watch,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';
import { useMutation, useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';

import { PermissionsInterface } from '@entity/permissions';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { required } from '~/functions/validators';

export default defineComponent({
  components: {
    userslist: defineAsyncComponent(() => import('~/components/settings/permissions/userslist.vue')),
    filters:   defineAsyncComponent(() => import('~/components/settings/permissions/filters.vue')),
    test:      defineAsyncComponent(() => import('~/components/settings/permissions/test.vue')),
  },
  setup () {
    const router = useRouter();
    const route = useRoute();
    const { result, variables } = useQuery(gql`
      query getPermissions($id: String) {
        permissions(id: $id) {
          id name order isCorePermission isWaterfallAllowed automation userIds excludeUserIds
          filters {
            id
            comparator
            type
            value
          }
        }
      }
    `, {
      id: route.value.params.id,
    });
    watch(result, (value) => {
      if (value && value.permissions && value.permissions[0]) {
        const { __typename, ...data } = value.permissions[0];
        model.value = data;
      }
    });
    watch(() => route.value.params.id, (id) => {
      variables.value = {
        id,
      };
    });
    const { mutate: updateMutation, onDone: onDoneUpdate, onError: onErrorUpdate, loading: saving } = useMutation(gql`
      mutation permissionUpdate($id: String!, $data: PermissionInput!) {
        permissionUpdate(id: $id, data: $data) {
          id
        }
      }`);
    function saveSuccess () {
      EventBus.$emit('settings::permissions::refresh');
      EventBus.$emit('snack', 'success', 'Data updated.');
    }
    onDoneUpdate(saveSuccess);
    onErrorUpdate(error);
    const { mutate: removeMutation, onDone: onDoneRemove, onError: onErrorRemove, loading: removing } = useMutation(gql`
      mutation permissionDelete($id: String!) {
        permissionDelete(id: $id)
      }`);
    onDoneRemove(() => {
      router.push('/settings/permissions');
    });
    onErrorRemove(error);

    const model = ref(null as PermissionsInterface | null);
    const valid = ref(true);

    const automationItems = ['none', 'casters', 'moderators', 'subscribers', 'vip', 'viewers', 'followers']
      .map(o => ({
        value: o, text: translate('core.permissions.' + o),
      }));

    const remove = (id: string) => {
      removeMutation({
        id,
      });
    };

    const save = () => {
      if (model.value && model.value.id && valid) {
        const { id, ...data } = model.value;
        updateMutation({
          id, data,
        });
      }
    };

    return {
      // refs
      model,
      automationItems,
      removing,
      saving,
      valid,

      // functions
      save,
      remove,

      // others
      translate,

      // validators
      required,
    };
  },
});
</script>
