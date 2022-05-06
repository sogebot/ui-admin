<template>
  <div>
    <v-dialog
      v-model="menu"
      persistent
      max-width="1000"
      scrollable
      :fullscreen="$vuetify.breakpoint.mobile"
    >
      <template #activator="{ on, attrs }">
        <v-btn v-if="item.id !== undefined" icon v-bind="attrs" v-on="on" class="primary-hover">
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
              v-model="item.command"
              :label="translate('command')"
              :rules="rules.command"
              hide-details="auto"
              required
            />

            <v-row dense>
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

            <v-text-field
              :label="capitalize(translate('count'))"
              :value="item.count"
              type="number"
              hide-details="auto"
              :rules="rules.count"
              append-outer-icon="mdi-restore"
              @click:append-outer="item.count = 0"
            />

            <v-row dense>
              <v-col>
                <v-switch
                  v-model="item.enabled"
                  :label="translate('enabled')"
                  persistent-hint
                  hide-details="auto"
                  :hint="(item.enabled
                    ? 'Custom command is enabled'
                    : 'Custom command is disabled')"
                />
              </v-col>
              <v-col>
                <v-switch
                  v-model="item.visible"
                  :label="capitalize(translate('visible'))"
                  persistent-hint
                  hide-details="auto"
                  :hint="(item.visible
                    ? 'Custom command will be visible in lists'
                    : 'Custom command won\'t be visible in lists')"
                />
              </v-col>
            </v-row>

            <draggable
              v-model="item.responses"
              draggable=".item"
              handle=".handle"
            >
              <v-list-item
                v-for="(r, i) of item.responses"
                :key="'response' + i"
                class="item"
              >
                <v-list-item-content>
                  <v-row dense align="center">
                    <v-col cols="auto">
                      <v-icon class="handle">
                        mdi-drag
                      </v-icon>
                    </v-col>
                    <v-col>
                      <v-lazy>
                        <v-textarea
                          v-model="item.responses[i].response"
                          hide-details="auto"
                          :label="translate('response') + '#' + (i + 1)"
                          :rows="1"
                          auto-grow
                          counter
                          :autofocus="i === 0"
                          @keydown.enter.prevent
                        >
                          <template #append>
                            <input-variables
                              :filters="['sender', 'param', '!param', 'touser']"
                              @input="item.responses[i].response = item.responses[i].response + $event"
                            />
                          </template>
                          <template #counter>
                            <v-row dense align="center">
                              <v-col>
                                <v-text-field
                                  v-model="item.responses[i].filter"
                                  dense
                                  hide-details="auto"
                                  solo
                                  :label="capitalize(translate('systems.customcommands.filter.name'))"
                                >
                                  <template #append>
                                    <input-variables
                                      :filters="['sender', 'source', 'param', 'haveParam', 'is.newchatter', 'is.moderator', 'is.subscriber', 'is.vip', 'is.follower', 'is.broadcaster', 'is.bot', 'is.owner', 'rank', 'game', 'language', 'title', 'followers', 'subscribers', 'isBotSubscriber']"
                                      @input="item.responses[i].filter = item.responses[i].filter + $event"
                                    />
                                  </template>
                                </v-text-field>
                              </v-col>
                              <v-col cols="auto">
                                <input-permissions
                                  :permissions="permissions"
                                  :permission="item.responses[i].permission"
                                  nullable
                                  @input="item.responses[i].permission = $event"
                                />
                              </v-col>
                              <v-col cols="auto">
                                <v-btn
                                  small
                                  plain
                                  @click="item.responses[i].stopIfExecuted = !item.responses[i].stopIfExecuted"
                                >
                                  {{ item.responses[i].stopIfExecuted ? translate('commons.stop-if-executed') : translate('commons.continue-if-executed') }}
                                </v-btn>
                              </v-col>
                            </v-row>
                          </template>
                        </v-textarea>
                      </v-lazy>
                    </v-col>
                    <v-col cols="auto">
                      <v-btn
                        icon
                        @click="remove(i)"
                      >
                        <v-icon>mdi-delete-forever</v-icon>
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-list-item-content>
              </v-list-item>
            </draggable>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn text @click="item.responses.push({ filter: '', order: item.responses.length, response: '', stopIfExecuted: false, permission: orderBy(permissions, 'order', 'asc').pop().id })">
            {{ translate('systems.customcommands.addResponse') }}
          </v-btn>

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
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineAsyncComponent,
  defineComponent, ref, watch,
} from '@vue/composition-api';
import { orderBy } from 'lodash';
import capitalize from 'lodash/capitalize';
import cloneDeep from 'lodash/cloneDeep';
import { v4 as uuid } from 'uuid';
import draggable from 'vuedraggable';

import { EventBus } from '~/functions/event-bus';
import type { CommandsInterfaceUI } from '~/pages/commands/customcommands.vue';

type Props = {
  value: Required<CommandsInterfaceUI>;
  rules: [];
};

const newItem = {
  command:   '',
  responses: [],
  group:     null,
  enabled:   true,
  visible:   true,
  count:     0,
};

export default defineComponent({
  components: {
    draggable,
    'input-variables': defineAsyncComponent({
      loader: () => import('~/components/inputVariables.vue'),
    }),
    'input-permissions': defineAsyncComponent({
      loader: () => import('~/components/inputPermissions.vue'),
    }),
  },
  props: {
    value:           Object,
    rules:           Object,
    permissionItems: Array,
    permissions:     Array,
    groupItems:      Array,
  },
  setup (props: Props, ctx) {
    const menu = ref(false);
    const item = ref(cloneDeep(props.value || newItem));
    const valid = ref(true);
    const saving = ref(false);
    const form = ref(null);
    const group = ref();

    function saveSuccess () {
      EventBus.$emit('snack', 'success', 'Data updated.');
    }
    const resetForm = () => {
      valid.value = true;
      if (form.value as unknown) {
        (form.value as unknown as HTMLFormElement).resetValidation();
        item.value = cloneDeep(props.value || newItem);
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

    watch(item, (val) => {
      for (let i = 0; i < val.responses.length; i++) {
        item.value.responses[i].order = i;
      }
    }, {
      deep: true,
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
        console.log('Updating', {
          data: item.value,
        });

        saving.value = true;

        getSocket('/systems/customcommands').emit('generic::setById', {
          id:   item.value.id ?? uuid(),
          item: item.value,
        }, () => {
          saving.value = false;
          menu.value = false;
          saveSuccess();
          ctx.emit('save');
        });
      }
    };

    const remove = (idx: number) => {
      if (item.value) {
        item.value.responses.splice(idx, 1);
      }
    };

    return {
      menu, item, save, translate, capitalize, valid, saving, form, orderBy, remove, group,
    };
  },
});
</script>
