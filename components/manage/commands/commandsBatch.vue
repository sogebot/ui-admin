<template>
  <div>
    <v-menu
      v-model="menu"
      offset-y
      :close-on-click="false"
      min-width="400"
      :close-on-content-click="false"
      offset-overflow
    >
      <template #activator="{ on, attrs }">
        <v-btn v-bind="attrs" small v-on="on">
          Batch update
        </v-btn>
      </template>
      <v-card outlined>
        <v-card-text>
          <v-form v-model="valid" lazy-validation>
            <v-row no-gutters>
              <v-col cols="auto" align-self="center">
                <v-simple-checkbox v-model="permissionToggle" />
              </v-col>
              <v-col>
                <v-select
                  v-model="permission"
                  :disabled="!permissionToggle"
                  :label="translate('permissions')"
                  clearable
                  :items="permissionItems"
                  hide-details="auto"
                />
              </v-col>
            </v-row>

            <v-row no-gutters>
              <v-col cols="auto" align-self="center">
                <v-simple-checkbox v-model="groupToggle" />
              </v-col>
              <v-col>
                <v-combobox
                  v-model="group"
                  :label="translate('group')"
                  :disabled="!groupToggle"
                  clearable
                  :search-input.sync="groupSearch"
                  hide-details="auto"
                  :return-object="false"
                  :items="groupItems.filter(o => o.value !== null)"
                >
                  <template #no-data>
                    <v-list-item>
                      Create&nbsp;<strong>{{ groupSearch }}</strong>
                    </v-list-item>
                  </template>
                </v-combobox>
              </v-col>
            </v-row>

            <v-row no-gutters>
              <v-col cols="auto" align-self="center">
                <v-simple-checkbox v-model="enabledToggle" />
              </v-col>
              <v-col>
                <v-switch
                  v-model="enabled"
                  :disabled="!enabledToggle"
                  :label="translate('enabled')"
                  persistent-hint
                  hide-details="auto"
                  :hint="(enabled
                    ? 'Custom command is enabled'
                    : 'Custom command is disabled')"
                />
              </v-col>
            </v-row>

            <v-row no-gutters>
              <v-col cols="auto" align-self="center">
                <v-simple-checkbox v-model="visibleToggle" />
              </v-col>
              <v-col>
                <v-switch
                  v-model="visible"
                  :disabled="!visibleToggle"
                  :label="capitalize(translate('visible'))"
                  persistent-hint
                  hide-details="auto"
                  :hint="(visible
                    ? 'Custom command will be visible in lists'
                    : 'Custom command won\'t be visible in lists')"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />

          <v-btn text @click="menu = false">
            Cancel
          </v-btn>
          <v-btn color="primary" text :disabled="!valid" @click="save()">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </div>
</template>

<script lang="ts">

import translate from '@sogebot/ui-helpers/translate';
import { defineComponent, ref } from '@vue/composition-api';
import capitalize from 'lodash/capitalize';

type Props = {
  length: number;
};

export default defineComponent({
  props: {
    length:          Number,
    permissionItems: Array,
    groupItems:      Array,
  },
  setup (props: Props, ctx) {
    const menu = ref(false);
    const valid = ref(true);

    const permission = ref(null);
    const permissionToggle = ref(false);

    const group = ref(null);
    const groupToggle = ref(false);
    const groupSearch = ref('');

    const enabled = ref(true);
    const enabledToggle = ref(false);

    const visible = ref(true);
    const visibleToggle = ref(false);

    const save = () => {
      ctx.emit('save', {
        permission: permissionToggle.value
          ? permission.value
          : undefined,
        group: groupToggle.value
          ? group.value
          : undefined,
        enabled: enabledToggle.value
          ? enabled.value
          : undefined,
        visible: visibleToggle.value
          ? visible.value
          : undefined,
      });
      menu.value = false;
    };

    return {
      permission,
      permissionToggle,
      group,
      groupToggle,
      groupSearch,
      enabled,
      enabledToggle,
      visible,
      visibleToggle,

      menu,
      save,
      translate,
      capitalize,
      valid,
    };
  },
});
</script>
