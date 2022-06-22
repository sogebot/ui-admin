<template>
  <div>
    <v-dialog
      v-model="menu"
      persistent
      max-width="800"
      scrollable
      :fullscreen="$vuetify.breakpoint.mobile"
    >
      <template #activator="{ on, attrs }">
        <v-btn v-if="item.id !== undefined" icon v-bind="attrs" class="primary-hover" v-on="on">
          <v-icon>
            mdi-pencil
          </v-icon>
        </v-btn>
        <v-btn v-else v-bind="attrs" color="primary" v-on="on">
          New item
        </v-btn>
      </template>
      <v-card outlined class="pt-3">
        <v-card-text>
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-text-field
              v-model="item.alias"
              :label="translate('alias')"
              :rules="rules.alias"
              hide-details="auto"
              :clearable="true"
              required
            />

            <v-textarea
              v-model="item.command"
              hide-details="auto"
              :label="translate('command')"
              :rows="1"
              :rules="rules.command"
              :clearable="true"
              auto-grow
              required
              @keydown.enter.prevent
            />

            <v-row dense>
              <v-col>
                <v-select
                  v-model="item.permission"
                  :label="translate('permissions')"
                  clearable
                  :items="permissionItems"
                  hide-details="auto"
                />
              </v-col>
              <v-col>
                <v-combobox
                  v-model="item.group"
                  :label="translate('group')"
                  hide-details="auto"
                  clearable
                  :search-input.sync="group"
                  :return-object="false"
                  :items="groupItems.filter(o => o.value !== null)"
                >
                  <template #no-data>
                    <v-list-item>
                      Create&nbsp;<strong>{{ group }}</strong>
                    </v-list-item>
                  </template>
                </v-combobox>
              </v-col>
            </v-row>

            <v-row dense>
              <v-col>
                <v-switch
                  v-model="item.enabled"
                  :label="translate('enabled')"
                  persistent-hint
                  hide-details="auto"
                  :hint="(item.enabled
                    ? 'Alias is enabled'
                    : 'Alias is disabled')"
                />
              </v-col>
              <v-col>
                <v-switch
                  v-model="item.visible"
                  :label="capitalize(translate('visible'))"
                  persistent-hint
                  hide-details="auto"
                  :hint="(item.visible
                    ? 'Alias will be visible in lists'
                    : 'Alias won\'t be visible in lists')"
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
          <v-btn color="primary" :loading="saving" text :disabled="!valid" @click="save()">
            Save &amp; Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { nextTick } from 'process';

import { useContext } from '@nuxtjs/composition-api';
import { Alias } from '@sogebot/backend/src/database/entity/alias';
import { defaultPermissions } from '@sogebot/ui-helpers/permissions/defaultPermissions';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, ref, watch,
} from '@vue/composition-api';
import capitalize from 'lodash/capitalize';
import cloneDeep from 'lodash/cloneDeep';
import { v4 } from 'uuid';

import { error as errorLog } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';

type Props = {
  value: Alias;
  rules: [];
};

const newAlias = {
  alias:      '',
  command:    '',
  enabled:    true,
  visible:    true,
  permission: defaultPermissions.VIEWERS,
  group:      null,
};

export default defineComponent({
  props: {
    value:           Object,
    rules:           Object,
    permissionItems: Array,
    groupItems:      Array,
  },
  setup (props: Props, ctx) {
    const menu = ref(false);
    const item = ref(cloneDeep(props.value || newAlias));
    const valid = ref(true);
    const form = ref(null);
    const group = ref('');
    const saving = ref(false);

    const resetForm = () => {
      valid.value = true;
      if (form.value as unknown) {
        (form.value as unknown as HTMLFormElement).resetValidation();
        item.value = cloneDeep(props.value || newAlias);
        if (item.value.id) {
          setTimeout(() => {
            item.value.command = item.value.command + ' ';
            nextTick(() => {
              item.value.command = item.value.command.trim();
            });
          }, 200);
        }
      } else {
        setTimeout(() => {
          resetForm();
        }, 100);
      }
    };

    watch(menu, (val) => {
      if (val) {
        resetForm();

        if (!item.value.id) {
          item.value = {
            ...item.value,
            id: v4(),
          };
        }
      }
    });

    const save = async () => {
      if ((form.value as unknown as HTMLFormElement).validate()) {
        // check validity
        for (const key of Object.keys(props.rules)) {
          for (const rule of (props.rules as any)[key]) {
            const ruleStatus = rule((item.value as any)[key]);
            if (ruleStatus === true) {
              continue;
            } else {
              EventBus.$emit('snack', 'red', `[${key}] - ${ruleStatus}`);
              return;
            }
          }
        }
        console.log('Updating', item.value);

        saving.value = true;
        await new Promise<void>((resolve) => {
          getSocket('/systems/alias').emit('generic::save', item.value, (err) => {
            if (err) {
              errorLog(err);
            } else {
              EventBus.$emit('snack', 'success', 'Data updated.');
            }
            resolve();
          });
        });
        EventBus.$emit('snack', 'success', 'Data updated.');
        saving.value = false;

        menu.value = false;
        ctx.emit('save');
      }
    };

    return {
      menu, item, save, translate, capitalize, valid, saving, form, group,
    };
  },
});
</script>
