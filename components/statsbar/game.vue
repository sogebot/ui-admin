<template>
  <v-col
    cols="6"
    lg="6"
    md="6"
    sm="6"
    class="pa-1"
  >
    <v-skeleton-loader
      v-if="!isLoaded"
      tile
      type="card"
      min-height="60"
      max-height="60"
    />
    <v-hover
      v-else
    >
      <template #default="{ hover }">
        <v-card
          tile
          min-height="60"
          elevation="5"
        >
          <v-row no-gutters>
            <v-col cols="auto" class="pr-1 d-none d-lg-flex">
              <v-img :src="'https://static-cdn.jtvnw.net/ttv-boxart/' + encodeURIComponent(game) + '-50x70.jpg'" max-width="35" />
            </v-col>
            <v-col>
              <v-card-subtitle class="pa-1 text-caption" style="line-height: 1.1rem;">
                <div class="text-truncate">
                  <strong>{{ capitalize(translate('title')) }}:</strong> <span v-html="title"></span>
                </div>
                <div class="text-truncate">
                  <strong>{{ capitalize(translate('game')) }}:</strong> {{ game }}
                </div>
                <div class="text-truncate">
                  <strong>{{ capitalize(translate('tags')) }}:</strong>
                  <small
                    v-for="tag of filterTags(true)"
                    :key="tag.name"
                    :class="{ 'grey--text': tag.is_auto }"
                  >
                    {{ tag.name }}
                  </small>
                  <span
                    v-for="tag of filterTags(false)"
                    :key="tag.name"
                    :class="{ 'grey--text': tag.is_auto }"
                  >
                    {{ tag.name }}
                  </span>
                </div>
              </v-card-subtitle>
            </v-col>
          </v-row>

          <v-fade-transition>
            <v-overlay
              v-if="hover"
              absolute
              color="#333"
            >
              <v-btn x-small @click="() => {}">
                {{ translate('click-to-change') }}
              </v-btn>
            </v-overlay>
          </v-fade-transition>
        </v-card>
      </template>
    </v-hover>
  </v-col>
</template>

<script lang="ts">
/* eslint-disable camelcase */
import { getTime } from '@sogebot/ui-helpers/getTime';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, onMounted, ref,
} from '@vue/composition-api';
import { capitalize, isNil } from 'lodash-es';

import { error } from '~/functions/error';

export default defineComponent({
  props: { timestamp: Number },
  setup (_, ctx) {
    const game = ref(null as null | string);
    const title = ref(null as null | string);
    const cachedTitle = ref('');
    const tags = ref([] as { is_auto: boolean; localization_names: { [x:string]: string } }[]);
    const isLoaded = ref(false);

    const filterTags = (is_auto: boolean) => {
      return tags.value.filter(o => !!o.is_auto === is_auto).map((o) => {
        const key = Object.keys(o.localization_names).find(key2 => key2.includes(ctx.root.$store.state.configuration.lang));
        return { name: o.localization_names[key || 'en-us'], is_auto: !!o.is_auto };
      }).sort((a, b) => {
        if ((a || { name: '' }).name < (b || { name: '' }).name) { // sort string ascending
          return -1;
        }
        if ((a || { name: '' }).name > (b || { name: '' }).name) {
          return 1;
        }
        return 0; // default return value (no sorting)
      });
    };

    const loadCustomVariableValue = (variable: string) => {
      return new Promise<string>((resolve) => {
        getSocket('/').emit('custom.variable.value', variable, (err: string | null, value: string) => {
          if (err) {
            error(err);
          }
          resolve(value);
        });
      });
    };

    const generateTitle = async (current: string, raw: string) => {
      if (raw.length === 0) {
        return current;
      }

      const variables = raw.match(/(\$_[a-zA-Z0-9_]+)/g);
      if (cachedTitle.value === current && isNil(variables)) {
        return cachedTitle.value;
      }

      if (!isNil(variables)) {
        for (const variable of variables) {
          const value = await loadCustomVariableValue(variable);
          raw = raw.replace(variable, `<strong style="border-bottom: 1px dotted gray" title="${variable}">${value}</strong>`);
        }
      }
      cachedTitle.value = raw;
      return raw;
    };

    onMounted(() => {
      getSocket('/').on('panel::stats', async (data: Record<string, any>) => {
        console.groupCollapsed('panel::stats::game');
        console.log(data.game);
        console.log(data.status);
        console.log(data.rawStatus);
        console.log(data.tags);
        console.groupEnd();
        game.value = data.game;
        title.value = await generateTitle(data.status, data.rawStatus);
        tags.value = data.tags;

        ctx.root.$store.commit('setCurrentGame', game.value);
        ctx.root.$store.commit('setCurrentTitle', title.value);
        ctx.root.$store.commit('setCurrentTags', tags.value);

        isLoaded.value = true;
      });
    });
    return {
      getTime, translate, capitalize, game, title, tags, filterTags, isLoaded,
    };
  },
});
</script>
