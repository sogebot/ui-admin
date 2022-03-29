<template>
<div>
        <v-form
          ref="form"
          v-model="valid"
          lazy-validation
        >
          <v-list-item
            v-for="(o, i) of operationsUpdated"
            :key="'operation' + i"
            class="item py-0"
          >
            <v-list-item-content class="pa-0">
              <v-row dense>
                <v-col>
                  <v-autocomplete
                    v-model="o.name"
                    :items="operationItems"
                    @input="operationUpdated(i)"
                  />
                </v-col>
                <v-col>
                  <div
                    v-for="defKey of Object.keys(o.definitions)"
                    :key="defKey"
                  >
                    <v-switch
                      v-if="typeof o.definitions[defKey] === 'boolean'"
                      v-model="o.definitions[defKey]"
                      :label="translate(`events.definitions.${defKey}.label`)"
                      hide-details="auto"
                    />
                    <v-select
                      v-if="defKey === 'taskId'"
                      v-model="o.definitions[defKey]"
                      :label="translate(`events.definitions.${defKey}.label`)"
                      :items="obsWebsocketsTaskIds"
                      :rules="rules[defKey]"
                      :return-object="false"
                      item-value="id"
                      hide-details="auto"
                    >
                      <template v-slot:selection="data">
                        {{ data.item.name }}&nbsp;<small>{{ data.item.id }}</small>
                      </template>
                      <template v-slot:item="data">
                        {{ data.item.name }}&nbsp;<small>{{ data.item.id }}</small>
                      </template>
                    </v-select>
                    <v-select
                      v-else-if="defKey === 'timeoutType' && o.name === 'run-command'"
                      :items="['normal', 'add', 'reset']"
                      persistent-hint
                      :label="translate(`events.definitions.${defKey}.label`)"
                      hint="NORMAL - trigger command after every event | ADD - add timeout to previous event | RESET - reset timeout"
                      v-model="o.definitions[defKey]"
                    />
                    <v-text-field
                      v-else-if="typeof o.definitions[defKey] === 'string'"
                      v-model="o.definitions[defKey]"
                      :rules="rules[defKey]"
                      :label="translate(`events.definitions.${defKey}.label`)"
                      :hint="translate('events.definitions.' + defKey + '.placeholder')"
                      persistent-hint
                      hide-details="auto"
                    >
                      <template #append>
                        <input-variables
                          v-if="['commandToRun', 'messageToSend'].includes(defKey)"
                          :filters="filters"
                          @input="o.definitions[defKey] = o.definitions[defKey] + $event"
                        />
                      </template>
                    </v-text-field>
                    <v-text-field
                      v-else-if="typeof o.definitions[defKey] === 'number'"
                      v-model.number="o.definitions[defKey]"
                      :rules="rules[defKey]"
                      type="number"
                      min="0"
                      :label="translate(`events.definitions.${defKey}.label`)"
                      :hint="translate('events.definitions.' + defKey + '.placeholder')"
                      persistent-hint
                      hide-details="auto"
                    />
                  </div>
                </v-col>
                <v-col cols="auto">
                  <v-spacer />
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
        </v-form>
        <div class="text-center pt-5">
          <v-btn @click="addEmptyOperation">
            Add operation
          </v-btn>
        </div>
</div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent, onMounted, ref, watch,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { useQuery, useResult } from '@vue/apollo-composable';
import {
  capitalize, cloneDeep, orderBy,
} from 'lodash';
import { v4 as uuid } from 'uuid';

import type { EventOperationInterface, Events } from '@entity/event';
import { OBSWebsocketInterface } from '@entity/obswebsocket.js';
import { error } from '~/functions/error';
import GET_ALL from '~/queries/obsWebsocket/getAll.gql';

export default defineComponent({
  props: {
    operations: Array, item: Object, rules: Object, filters: Array, variables: Object, events: Array,
  },
  setup (props, ctx) {
    const { result } = useQuery(GET_ALL, null, {
      pollInterval: 5000,
    });
    const obsWebsocketsTaskIds = useResult<{ OBSWebsocket: OBSWebsocketInterface[] }, OBSWebsocketInterface[], OBSWebsocketInterface[]>(result, [], data => data.OBSWebsocket);

    const valid = ref(true);
    const form = ref(null);

    const operationsUpdated = ref(cloneDeep(props.operations ?? []) as Omit<EventOperationInterface, 'event'>[]);
    const supportedOperations = ref([] as Events.SupportedOperation[]);

    const operationItems = computed(() => {
      return supportedOperations.value.map(o => ({
        value: o.id,
        text:  capitalize(translate(o.id)),
      }));
    });

    onMounted(() => {
      getSocket('/core/events').emit('list.supported.operations', (err, data: Events.SupportedOperation[]) => {
        if (err) {
          error(err);
          return;
        }
        supportedOperations.value = data.sort((a, b) => {
          const A = translate(a.id).toLowerCase();
          const B = translate(b.id).toLowerCase();
          if (A < B) { // sort string ascending
            return -1;
          }
          if (A > B) {
            return 1;
          }
          return 0; // default return value (no sorting)
        });
      });
    });

    watch(operationsUpdated, (val) => {
      ctx.emit('update:operations', val);
    }, {
      deep: true,
    });

    const remove = (idx: number) => {
      operationsUpdated.value.splice(idx, 1);
    };

    const addEmptyOperation = () => {
      if (supportedOperations.value.length === 0) {
        return;
      }
      operationsUpdated.value.push({
        id:          uuid(),
        name:        supportedOperations.value[0].id,
        definitions: getEmptyDefinitionOf(supportedOperations.value[0].id),
      });
    };

    const getEmptyDefinitionOf = (name: string) => {
      const defaultOperation = supportedOperations.value.find(o => o.id === name);
      const emptyDefinitions = {
      } as Record<string, any>;
      if (defaultOperation) {
        if (Object.keys(defaultOperation.definitions).length > 0) {
          for (const [key, value] of Object.entries(defaultOperation.definitions)) {
            emptyDefinitions[key] = Array.isArray(value) ? value[0] : value; // select first option by default
          }
        }
      }
      return emptyDefinitions;
    };

    const operationUpdated = (idx: number) => {
      operationsUpdated.value.splice(idx, 1, {
        id:          operationsUpdated.value[idx].id,
        name:        operationsUpdated.value[idx].name,
        definitions: getEmptyDefinitionOf(operationsUpdated.value[idx].name),
      });
    };

    return {
      orderBy,
      translate,
      capitalize,
      close,
      remove,
      operationsUpdated,
      addEmptyOperation,
      operationItems,
      getEmptyDefinitionOf,
      operationUpdated,
      valid,
      form,
      obsWebsocketsTaskIds,
    };
  },
});
</script>

<style scoped>
.dense .v-list-item {
  min-height: 25px !important;
}
</style>
