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

          <settings-permissions-userslist
            v-if="!model.isCorePermission"
            v-model="model.userIds"
            :label="translate('core.permissions.manuallyAddedUsers')"
          />

          <settings-permissions-userslist
            v-if="!model.isCorePermission"
            v-model="model.excludeUserIds"
            :label="translate('core.permissions.manuallyExcludedUsers')"
          />

          <settings-permissions-filters
            v-if="!model.isCorePermission"
            v-model="model.filters"
          />

          <settings-permissions-test :permission="model.id" />
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

<script setup lang="ts">
import { PermissionsInterface } from '@entity/permissions';
import translate from '@sogebot/ui-helpers/translate';
import gql from 'graphql-tag';

import { EventBus } from '~/functions/event-bus';
import { required } from '~/functions/validators';

const { $graphql } = useNuxtApp();

const router = useRouter();
const route = useRoute();

const loading = ref(true);
const saving = ref(false);
const removing = ref(false);

const refetch = async () => {
  const result = await $graphql.default.request(gql`
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
    `, { id: route.params.id });
  if (result && result.permissions && result.permissions[0]) {
    const { __typename, ...data } = result.permissions[0];
    model.value = data;
  }
  loading.value = false;
};
onMounted(() => {
  refetch();
});
watch(() => route.params.id, () => {
  refetch();
})

const model = ref(null as PermissionsInterface | null);
const valid = ref(true);

const automationItems = ['none', 'casters', 'moderators', 'subscribers', 'vip', 'viewers', 'followers']
  .map(o => ({ value: o, text: translate('core.permissions.' + o) }));

const remove = async (id: string) => {
  removing.value = true;
  await $graphql.default.request(gql`
      mutation permissionDelete($id: String!) {
        permissionDelete(id: $id)
      }`, { id });
  router.push('/settings/permissions');
  removing.value = false;
};

const save = async () => {
  if (model.value && model.value.id && valid) {
    saving.value = true;
    const { id, ...data } = model.value;
    await $graphql.default.request(gql`
    mutation permissionUpdate($id: String!, $data: PermissionInput!) {
        permissionUpdate(id: $id, data: $data) {
          id
        }
      }`, { id, data });
    EventBus.$emit('settings::permissions::refresh');
    EventBus.$emit('snack', 'success', 'Data updated.');
    saving.value = false;
  }
};
</script>
