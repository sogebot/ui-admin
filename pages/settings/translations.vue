<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <v-data-table
      :search="search"
      :loading="state.loading !== ButtonStates.success"
      :headers="headers"
      :items-per-page="15"
      :items="items"
    >
      <template #top>
        <v-sheet
          flat
          color="dark"
          class="my-2 pb-2 mt-0"
        >
          <v-row class="px-2" no-gutters>
            <v-col align-self="center">
              <v-text-field
                v-model="search"
                append-icon="mdi-magnify"
                label="Search"
                single-line
                hide-details
                class="pa-0 ma-2"
              />
            </v-col>
          </v-row>
        </v-sheet>
      </template>

      <template #[`item.current`]="{ item }">
        <v-edit-dialog
          persistent
          large
          :return-value.sync="item.current"
          @save="update(item.name, item.current, item.default)"
        >
          {{ item.current }}
          <template #input>
            <v-text-field
              v-model="item.current"
              single-line
              :clearable="true"
              counter
            >
              <template v-if="item.current !== item.default" #append-outer>
                <v-btn text small @click="item.current = item.default">
                  Revert
                </v-btn>
              </template>
            </v-text-field>
          </template>
        </v-edit-dialog>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import {
  defineComponent, onMounted, ref,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';

import { EventBus } from '~/functions/event-bus';

export default defineComponent({
  setup () {
    const items = ref([] as { name: string; current: string; default: string; }[]);

    const search = ref('');
    const state = ref({ loading: ButtonStates.progress } as {
      loading: number;
    });

    onMounted(() => {
      refresh();
    });

    const headers = [
      { value: 'name', text: 'Key' },
      { value: 'current', text: 'Value' },
    ];

    const refresh = () => {
      getSocket('/').emit('responses.get', null, (data) => {
        console.groupCollapsed('translations::responses.get');
        console.log(data);
        console.groupEnd();
        items.value = Object
          .entries(data)
          .map((o) => {
            if ((o[1] as any).current.startsWith('{missing')) {
              console.debug(`${o[0]} have missing translation`);
            }
            return {
              name:    o[0] as string,
              current: (o[1] as any).current as string,
              default: (o[1] as any).default as string,
            };
          })
          .filter(o => !o.name.startsWith('webpanel') && !o.name.startsWith('ui'))
          .sort((a, b) => {
            const keyA = a.name.toUpperCase(); // ignore upper and lowercase
            const keyB = b.name.toUpperCase(); // ignore upper and lowercase
            if (keyA < keyB) {
              return -1;
            }
            if (keyA > keyB) {
              return 1;
            }

            // names must be equal
            return 0;
          });
        state.value.loading = ButtonStates.success;
      });
    };

    const update = (name: string, value: string, defaultValue: string) => {
      if (value === defaultValue) {
        getSocket('/').emit('responses.revert', { name }, () => {
          EventBus.$emit('snack', 'success', 'Translation updated.');
        });
      } else {
        getSocket('/').emit('responses.set', { name, value });
        EventBus.$emit('snack', 'success', 'Translation updated.');
      }
    };

    return {
      items,
      search,
      state,
      headers,
      translate,
      update,

      ButtonStates,
    };
  },
});
</script>
