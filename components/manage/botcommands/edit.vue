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
        <v-btn v-bind="attrs" class="primary-hover" v-on="on" icon>
          <v-icon>
            mdi-pencil
          </v-icon>
        </v-btn>
      </template>
      <v-card outlined class="pt-3">
        <v-card-text>
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-text-field
              v-model="item.command"
              :label="translate('command')"
              :rules="rules.command"
              hide-details="auto"
              required
            >
              <template #append>
                <v-btn v-if="item.command !== item.defaultValue" small text @click="item.command = item.defaultValue">
                  set to default
                </v-btn>
              </template>
            </v-text-field>

            <v-select
              v-model="item.permission"
              :label="translate('permissions')"
              clearable
              :items="permissionItems"
              hide-details="auto"
            />
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

import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, ref, watch,
} from '@vue/composition-api';
import capitalize from 'lodash/capitalize';
import cloneDeep from 'lodash/cloneDeep';

import { EventBus } from '~/functions/event-bus';
import type { AliasInterfaceUI } from '~/pages/commands/alias.vue';

type Props = {
  value: AliasInterfaceUI;
  rules: [];
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
    const item = ref(cloneDeep(props.value));
    const valid = ref(true);
    const form = ref(null);
    const saving = ref(false);

    function saveSuccess () {
      EventBus.$emit('snack', 'success', 'Data updated.');
    }

    const resetForm = () => {
      valid.value = true;
      if (form.value as unknown) {
        (form.value as unknown as HTMLFormElement).resetValidation();
        item.value = cloneDeep(props.value);
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
      }
    });

    const save = () => {
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
        const data = item.value;
        console.log('Updating', {
          data,
        });

        saving.value = true;
        getSocket('/core/general').emit('generic::setCoreCommand', item.value, () => {
          saveSuccess();
          menu.value = false;
          ctx.emit('save');
          saving.value = false;
        });
      }
    };

    return {
      menu, item, save, translate, capitalize, valid, saving, form,
    };
  },
});
</script>
