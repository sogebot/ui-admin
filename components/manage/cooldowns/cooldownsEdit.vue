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
            <v-textarea
              v-model="item.name"
              hide-details="auto"
              :label="translate('name')"
              :rows="1"
              :rules="rules.name"
              :clearable="true"
              auto-grow
              required
              @keydown.enter.prevent
            />

            <form-x-time-input
              v-model.number="item.miliseconds"
              :rules="rules.miliseconds"
              :label="translate('cooldown')"
            />

            <v-select
              v-model="item.type"
              :label="translate('type')"
              hide-details="auto"
              persistent-hint
              :items="typeItems"
              :hint="`${item.type === 'global' ? 'Cooldown will be shared among users.' : 'Each user will have own cooldown'}`"
            />

            <v-row no-gutters>
              <v-col>
                <v-switch
                  v-model="item.isEnabled"
                  :label="translate('enabled')"
                  persistent-hint
                  hide-details="auto"
                  :hint="(item.isEnabled
                    ? 'Cooldown is enabled.'
                    : 'Cooldown is disabled.')"
                />
              </v-col>
              <v-col>
                <v-switch
                  v-model="item.isErrorMsgQuiet"
                  :label="capitalize(translate('quiet'))"
                  persistent-hint
                  hide-details="auto"
                  :hint="(item.isErrorMsgQuiet
                    ? 'Cooldown won\'t send message if triggered.'
                    : 'Cooldown will send message if triggered.')"
                />
              </v-col>
            </v-row>

            <v-row no-gutters>
              <v-col>
                <v-switch
                  v-model="item.isOwnerAffected"
                  :label="capitalize(translate('core.permissions.casters'))"
                  persistent-hint
                  hide-details="auto"
                  :hint="(item.isOwnerAffected
                    ? 'Owners will be affected with cooldown.'
                    : 'Owners won\'t be affected with cooldown.')"
                />
              </v-col>
              <v-col>
                <v-switch
                  v-model="item.isModeratorAffected"
                  :label="capitalize(translate('core.permissions.moderators'))"
                  persistent-hint
                  hide-details="auto"
                  :hint="(item.isModeratorAffected
                    ? 'Moderators will be affected with cooldown.'
                    : 'Moderators won\'t be affected with cooldown.')"
                />
              </v-col>
            </v-row>

            <v-row no-gutters>
              <v-col>
                <v-switch
                  v-model="item.isSubscriberAffected"
                  :label="capitalize(translate('core.permissions.subscribers'))"
                  persistent-hint
                  hide-details="auto"
                  :hint="(item.isSubscriberAffected
                    ? 'Subscribers will be affected with cooldown.'
                    : 'Subscribers won\'t be affected with cooldown.')"
                />
              </v-col>
              <v-col>
                <v-switch
                  v-model="item.isFollowerAffected"
                  :label="capitalize(translate('core.permissions.followers'))"
                  persistent-hint
                  hide-details="auto"
                  :hint="(item.isFollowerAffected
                    ? 'Followers will be affected with cooldown.'
                    : 'Followers won\'t be affected with cooldown.')"
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

import type { CooldownInterface } from '@entity/cooldown';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, ref, watch,
} from '@vue/composition-api';
import capitalize from 'lodash/capitalize';
import cloneDeep from 'lodash/cloneDeep';
import { v4 } from 'uuid';

import { EventBus } from '~/functions/event-bus';

type Props = {
  value: CooldownInterface;
  rules: [];
};

const newItem = {
  name:                 '',
  miliseconds:                60000,
  type:                 'global',
  isErrorMsgQuiet:      false,
  isEnabled:            true,
  isOwnerAffected:      false,
  isModeratorAffected:  false,
  isSubscriberAffected: false,
  isFollowerAffected:   false,
};

export default defineComponent({
  props: {
    value:     Object,
    rules:     Object,
    typeItems: Array,
  },
  setup (props: Props, ctx) {
    const menu = ref(false);
    const item = ref(cloneDeep(props.value || newItem));
    const valid = ref(true);
    const saving = ref(false);
    const form = ref(null);

    const resetForm = () => {
      valid.value = true;
      if (form.value as unknown) {
        (form.value as unknown as HTMLFormElement).resetValidation();
        item.value = cloneDeep(props.value || newItem);
        if (item.value.id) {
          setTimeout(() => {
            item.value.name = item.value.name + ' ';
            nextTick(() => {
              item.value.name = item.value.name.trim();
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
        const { id, ...data } = item.value;
        console.log('Updating', { data });

        saving.value = true;
        getSocket('/systems/cooldown').emit('cooldown::save', {
          ...data,
          id: id || v4(),
        }, () => {
          saving.value = false;
          menu.value = false;
          EventBus.$emit('snack', 'success', 'Data updated.');
          ctx.emit('save');
        });
      }
    };

    return {
      menu, item, save, translate, capitalize, valid, form, saving,
    };
  },
});
</script>
