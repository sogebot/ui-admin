<template>
  <loading v-if="!settings" />
  <v-form v-else v-model="valid" lazy-validation>
    <v-tabs v-model="tab">
      <v-tab>{{ translate('categories.general') }}</v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab"  style="overflow: visible;">
      <v-tab-item eager>
        <v-card flat>
          <v-card-text>
            <v-toolbar dense color="#1e1e1e" flat>
              <v-toolbar-title>
                <label class="v-label theme--dark">
                  Mini-Widgets
                </label>
              </v-toolbar-title>
              <v-row no-gutters>
                <v-col cols="10">
                  <v-row>
                    <v-col style="text-align: right;" cols="6">
                      <v-slide-x-transition>
                        <v-btn v-if="selected && selectedIdx !== 0" class="include" color="info" icon @click="moveLeft()">
                          <v-icon>mdi-chevron-left</v-icon>
                        </v-btn>
                      </v-slide-x-transition>
                    </v-col>
                    <v-col cols="6">
                      <v-slide-x-reverse-transition>
                        <v-btn v-if="selected && selectedIdx !== settings.miniWidgets[0].length - 1" class="include" color="info" icon @click="moveRight()">
                          <v-icon>mdi-chevron-right</v-icon>
                        </v-btn>
                      </v-slide-x-reverse-transition>
                    </v-col>
                  </v-row>
                </v-col>
                <v-col cols="2" style="text-align: right;">
                  <v-slide-x-reverse-transition>
                    <v-btn v-if="selected" class="include" color="error" @click="removeSelected" icon>
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </v-slide-x-reverse-transition>
                </v-col>
              </v-row>
            </v-toolbar>

            <transition-group
              name="list"
              tag="div"
              class="row py-3"
              v-on:leave="leave">
              <v-col
                v-for="item of settings.miniWidgets[0]"
                :key="item"
                :cols="cols[item] ? cols[item][0] : 6"
                :lg="cols[item] ? cols[item][1] : 2"
                :md="cols[item] ? cols[item][2] : 4"
                :sm="cols[item] ? cols[item][3] : 4"
                class="pa-1 include list-item"
                style="cursor: pointer;"
                @click="select(item)"
                v-click-outside="{
                    handler: () => selected = null,
                    include: include,
                  }"
              >
                <div class="v-card v-sheet theme--dark elevation-5 rounded-0 pa-3"  :class="{ 'primary': selected === item, 'border-primary': true }">
                  <v-icon v-if="item.split('|')[0] === 'twitch'" x-large class="hidden-icon" color="#9146FF">
                    mdi-twitch
                  </v-icon>
                  <v-icon v-if="item.split('|')[0] === 'general'" x-large class="hidden-icon">
                    mdi-circle-double
                  </v-icon>
                  <div class="text-truncate">
                    {{ item.split('|')[1] }}
                  </div>
                </div>
              </v-col>
            </transition-group>
          </v-card-text>
        </v-card>
      </v-tab-item>
    </v-tabs-items>
  </v-form>
</template>

<script lang="ts">
import { useStore } from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  computed,
  defineComponent, nextTick, onMounted, ref, watch,
} from '@vue/composition-api';
import gsap from 'gsap';

import { error } from '~/functions/error';
import { saveSettings } from '~/functions/settings';

export default defineComponent({
  setup () {
    const settings = ref(null as Record<string, any> | null);
    const ui = ref(null as Record<string, any> | null);
    const store = useStore<any>();
    const valid = ref(true);
    const tab = ref(null);
    const selected = ref(null as string | null);

    const cols = { 'twitch|status': [12, 12, 12, 12] };

    watch(settings, () => {
      store.commit('settings/pending', true);
    }, { deep: true });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/core/dashboard', store, settings.value);
      }
    });

    onMounted(() => {
      getSocket(`/core/dashboard`)
        .emit('settings', (err: string | null, _settings: { [x: string]: any }, _ui: { [x: string]: { [attr: string]: any } }) => {
          if (err) {
            error(err);
            return;
          }
          ui.value = _ui;
          settings.value = _settings;
          nextTick(() => { store.commit('settings/pending', false); });
        });
    });

    function select (item: string) {
      selected.value = selected.value === item ? null : item;
    }

    function removeSelected () {
      if (selected.value && settings.value) {
        const items = settings.value.miniWidgets[0].filter((o: string) => o !== selected.value);
        settings.value.miniWidgets = [items, settings.value.miniWidgets[1]];
      }
      selected.value = null;
    }

    const selectedIdx = computed(() => {
      if (selected.value && settings.value) {
        return settings.value.miniWidgets[0].indexOf(selected.value);
      }
      return -1;
    });

    function moveLeft () {
      if (settings.value) {
        const newIndex = selectedIdx.value - 1;
        const items = settings.value.miniWidgets[0];
        [items[newIndex], items[selectedIdx.value]] = [items[selectedIdx.value], items[newIndex]];
        settings.value.miniWidgets = [items, [settings.value.miniWidgets[1]]];
      }
    }
    function moveRight () {
      if (settings.value) {
        const newIndex = selectedIdx.value + 1;
        const items = settings.value.miniWidgets[0];
        [items[newIndex], items[selectedIdx.value]] = [items[selectedIdx.value], items[newIndex]];
        settings.value.miniWidgets = [items, [settings.value.miniWidgets[1]]];
      }
    }

    const include = () => {
      return [...document.querySelectorAll('.include')];
    };

    const leave = (el: HTMLElement, done: () => void) => {
      el.style.left = `${el.offsetLeft}px`;
      el.style.top = `${el.offsetTop}px`;
      el.style.zIndex = '999999';
      el.style.position = `absolute`;
      gsap.to(el, {
        opacity: 0, top: el.offsetTop + 100, duration: 0.2, onComplete: done,
      });
    };

    return {
      settings,
      ui,
      translate,
      valid,
      tab,
      cols,
      selected,
      selectedIdx,
      select,
      removeSelected,
      moveLeft,
      moveRight,
      include,
      leave,
    };
  },
});
</script>

<style scoped>
.row {
  overflow: visible;
}

.border-primary {
  border: 1px dotted var(--v-secondary-base) !important;
  overflow: hidden;
}

.hidden-icon {
  position: absolute !important;
  right: 0;;
  transform: rotate(45deg) translateY(7px);
  opacity: 0.4;
}

.include {
  user-select: none;
}

.list {
  position: absolute;
}

.list-item {
  transition: all 0.2s;
}
</style>
