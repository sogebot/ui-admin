<template>
  <v-container
    fluid
    :class="{ 'pa-4': !$vuetify.breakpoint.mobile }"
  >
    <h2 v-if="!$vuetify.breakpoint.mobile">
      {{ translate('menu.carousel') }}
    </h2>

    <v-data-table
      v-model="selected"
      calculate-widths
      :show-select="selectable"
      :search="search"
      :loading="state.loading !== ButtonStates.success || state.saving"
      :headers="headers"
      :items-per-page="-1"
      :items="items"
      sort-by="order"
      @current-items="saveCurrentItems"
      @click:row="addToSelectedItem"
    >
      <template #top>
        <v-sheet
          flat
          color="dark"
          class="my-2 p-2"
        >
          <v-row class="px-2" no-gutters>
            <v-col cols="auto" align-self="center" class="pr-2">
              <v-btn icon :color="selectable ? 'primary' : 'secondary'" @click="selectable = !selectable">
                <v-icon>
                  {{ mdiCheckBoxMultipleOutline }}
                </v-icon>
              </v-btn>
            </v-col>
            <v-col align-self="center">
              <v-text-field
                v-model="search"
                :append-icon="mdiMagnify"
                label="Search"
                single-line
                hide-details
                class="pa-0 ma-2"
              />
            </v-col>
            <v-col cols="auto" align-self="center">
              <v-row no-gutters>
                <v-col>
                  <template v-if="selected.length > 0">
                    <v-dialog
                      v-model="deleteDialog"
                      max-width="500px"
                    >
                      <template #activator="{ on, attrs }">
                        <v-btn
                          color="error"
                          class="mr-1"
                          v-bind="attrs"
                          v-on="on"
                        >
                          Delete {{ selected.length }} Item(s)
                        </v-btn>
                      </template>

                      <v-card>
                        <v-card-title>
                          <span class="headline">Delete {{ selected.length }} Item(s)?</span>
                        </v-card-title>

                        <v-card-actions>
                          <v-spacer />
                          <v-btn
                            text
                            @click="deleteDialog = false"
                          >
                            Cancel
                          </v-btn>
                          <v-btn
                            color="error"
                            text
                            @click="deleteSelected"
                          >
                            Delete
                          </v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-dialog>
                  </template>
                </v-col>
                <v-col>
                  <form
                    enctype="multipart/form-data"
                    novalidate
                  >
                    <v-btn
                      color="primary"
                      :loading="state.uploading === ButtonStates.progress"
                      @click="$refs.uploadFileInput.click()"
                    >
                      Upload item
                    </v-btn>
                    <input
                      ref="uploadFileInput"
                      class="d-none input-file"
                      type="file"
                      :disabled="state.uploading === ButtonStates.progress"
                      multiple
                      accept="image/*"
                      @change="filesChange($event.target.files)"
                    >
                  </form>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-sheet>
      </template>

      <template #[`item.showOnlyOncePerStream`]="{ item }">
        <v-simple-checkbox
          v-if="item.id !== 'last'"
          v-model="item.showOnlyOncePerStream"
          @click="update(item, true, 'showOnlyOncePerStream')"
        />
      </template>

      <template #[`item.drag`]="{ item }">
        <v-icon v-if="item.id !== 'last'" :disabled="state.dragging || state.saving" @mousedown.prevent="handleDragStart($event, item.id)">
          {{ mdiDrag }}
        </v-icon>
      </template>

      <template #[`item.waitBefore`]="{ item }">
        {{ item.id !== 'last' ? item.waitBefore : '' }}
      </template>

      <template #[`item.waitAfter`]="{ item }">
        {{ item.id !== 'last' ? item.waitAfter : '' }}
      </template>

      <template #[`item.duration`]="{ item }">
        {{ item.id !== 'last' ? item.duration : '' }}
      </template>

      <template #[`item.animationInDuration`]="{ item }">
        {{ item.id !== 'last' ? item.animationInDuration : '' }}
      </template>

      <template #[`item.animationIn`]="{ item }">
        {{ item.id !== 'last' ? item.animationIn : '' }}
      </template>

      <template #[`item.animationOutDuration`]="{ item }">
        {{ item.id !== 'last' ? item.animationOutDuration : '' }}
      </template>

      <template #[`item.animationOut`]="{ item }">
        {{ item.id !== 'last' ? item.animationOut : '' }}
      </template>

      <template #[`item.image`]="{ item }">
        <v-img
          v-if="item.id !== 'last'"
          :id="item.id"
          contain
          :src="item.imageUrl"
          max-height="75px"
          max-width="150px"
        />
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import {
  mdiCheckBoxMultipleOutline, mdiDrag, mdiMagnify,
} from '@mdi/js';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';

import type { CarouselInterface } from '.bot/src/bot/database/entity/carousel';
import { addToSelectedItem } from '~/functions/addToSelectedItem';
import api from '~/functions/api';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';

function handleDragStart (e: DragEvent, id: string) {
  EventBus.$emit(`carousel::dragstart`);
  // we want to select first tr
  let element: HTMLElement;
  for (const el of (e as any).path as unknown as HTMLElement[]) {
    if (el.tagName === 'TR') {
      element = el;
      document.onmouseup = handleDragEnd;
      break;
    }
  }
  // enable mouse move listener
  function elementDrag (ev: MouseEvent) {
    element.style.opacity = '0.8';
    element.style.zIndex = String(9999);
    element.style.top = ev.pageY + 'px';
    element.style.left = (ev.pageX - 250) + 'px';
    element.style.position = 'absolute';
  }

  function handleDragEnd (ev: MouseEvent) {
    let parent: null | HTMLElement = null;
    let elFromPoint = document.elementFromPoint(ev.clientX, ev.clientY);
    if (elFromPoint) {
      while (!parent) {
        const parentElement: HTMLElement | null = elFromPoint?.parentElement;
        if (parentElement) {
          if (parentElement.tagName === 'TR') {
            parent = parentElement;
          } else {
            elFromPoint = parentElement;
          }
        } else {
          break;
        }
      }
    }
    if (parent) {
      try {
        const offsetId = parent.children[1].children[0].id;
        EventBus.$emit(`carousel::dragdrop`, { id, offsetId });
      } catch {
        EventBus.$emit(`carousel::dragdrop`, { id });
      }
    }
    element.style.position = 'inherit';
    element.style.opacity = '1';
    document.onmousemove = null;
    document.onmouseup = null;
    EventBus.$emit(`carousel::dragstop`);
  }
  document.onmousemove = elementDrag;
}

export default defineComponent({
  setup (_, ctx) {
    const items = ref([] as CarouselInterface[]);
    const search = ref('');
    const rules = {};
    const timestamp = ref(Date.now());

    const uploadedFiles = ref(0);
    const isUploadingNum = ref(0);
    watch(uploadedFiles, (val: number) => {
      if (isUploadingNum.value === val) {
        state.value.uploading = ButtonStates.idle;
      } else {
        state.value.uploading = ButtonStates.progress;
      }
    });

    const selected = ref([] as CarouselInterface[]);
    const currentItems = ref([] as CarouselInterface[]);
    const saveCurrentItems = (value: CarouselInterface[]) => {
      currentItems.value = value;
    };
    const deleteDialog = ref(false);
    const selectable = ref(false);
    watch(selectable, (val) => {
      if (!val) {
        selected.value = [];
      }
    });

    const state = ref({
      dragging: false, saving: false, loading: ButtonStates.progress, uploading: ButtonStates.idle,
    } as {
      uploading: number;
      loading: number;
      dragging: boolean;
      saving: boolean;
    });

    const headers = [
      {
        value: 'drag', text: '', sortable: false,
      },
      {
        value: 'image', text: 'image', sortable: false,
      },
      {
        value: 'waitBefore', text: 'waitBefore', sortable: false,
      },
      {
        value: 'waitAfter', text: 'waitAfter', sortable: false,
      },
      {
        value: 'duration', text: 'duration', sortable: false,
      },
      {
        value: 'animationInDuration', text: 'animationInDuration', sortable: false,
      },
      {
        value: 'animationIn', text: 'animationIn', sortable: false,
      },
      {
        value: 'animationOutDuration', text: 'animationOutDuration', sortable: false,
      },
      {
        value: 'animationOut', text: 'animationOut', sortable: false,
      },
      {
        value: 'showOnlyOncePerStream', text: 'showOnlyOncePerStream', sortable: false,
      },
    ];

    watch(() => state.value.dragging, (val) => {
      if (val) {
        items.value.push({
          id:                    'last',
          order:                 items.value.length,
          type:                  '',
          waitBefore:            0,
          waitAfter:             0,
          duration:              0,
          animationInDuration:   0,
          animationIn:           '',
          animationOut:          '',
          animationOutDuration:  0,
          showOnlyOncePerStream: false,
          base64:                '',
        });
      } else {
        items.value = items.value.filter(o => o.id !== 'last');
      }
    });

    onMounted(() => {
      refresh();
      EventBus.$on(`carousel::dragstart`, () => {
        state.value.dragging = true;
      });
      EventBus.$on(`carousel::dragstop`, () => {
        state.value.dragging = false;
      });
      EventBus.$on(`carousel::dragdrop`, (data: {id: string, offsetId?: string}) => {
        // reorder items
        // remove id
        const draggedItem = items.value.find(item => item.id === data.id);
        if (draggedItem) {
          items.value = items.value.filter(item => item.id !== data.id);

          if (data.offsetId) {
            // search idx of offset id
            const idx = items.value.findIndex(item => item.id === data.offsetId);
            if (idx >= 0) {
              items.value.splice(idx, 0, draggedItem);
            }
          } else {
            // save as last item
            items.value.push({ ...draggedItem, order: items.value.length });
          }
          // reorder
          for (let i = 0; i < items.value.length; i++) {
            items.value[i].order = i;
          }
          state.value.saving = true;
          Promise.all(
            items.value.map((item) => {
              return api.patch<{ order: number }>(ctx.root.$axios, `/api/v1/carousel/${item.id}`, { order: item.order });
            }),
          ).then(saveSuccess);
        }
      });
    });

    const refresh = () => {
      api.get<CarouselInterface[]>(ctx.root.$axios, `/api/v1/carousel/`)
        .then(response => (items.value = response.data.data))
        .then(() => (state.value.loading = ButtonStates.success));
    };

    const saveSuccess = () => {
      refresh();
      EventBus.$emit('snack', 'success', 'Data updated.');
      state.value.saving = false;
    };

    const deleteSelected = () => {
      deleteDialog.value = false;
      selected.value.forEach((item) => {
        api.delete(ctx.root.$axios, `/api/v1/carousel/${item.id}`).catch(() => {
          return true;
        });
      });
      refresh();

      EventBus.$emit('snack', 'success', 'Data removed.');
      selected.value = [];
    };

    const update = async (item: typeof items.value[number], multi = false, attr: keyof typeof items.value[number]) => {
      // check validity
      for (const key of Object.keys(rules)) {
        for (const rule of (rules as any)[key]) {
          const ruleStatus = rule((item as any)[key]);
          if (ruleStatus === true) {
            continue;
          } else {
            EventBus.$emit('snack', 'red', `[${key}] - ${ruleStatus}`);
            refresh();
            return;
          }
        }
      }

      await Promise.all(
        [item, ...(multi ? selected.value : [])].map((itemToUpdate) => {
          return new Promise((resolve) => {
            console.log('Updating', { itemToUpdate }, { attr, value: item[attr] });
            api.patch<CarouselInterface>(ctx.root.$axios, `/api/v1/carousel/${itemToUpdate.id}`, { [attr]: item[attr] }).then(() => {
              resolve(true);
            });
          });
        }),
      );
      refresh();
      EventBus.$emit('snack', 'success', 'Data updated.');
    };

    const filesChange = async (filesUpload: HTMLInputElement['files']) => {
      if (!filesUpload) {
        return;
      }
      state.value.uploading = ButtonStates.progress;
      isUploadingNum.value = filesUpload.length;
      uploadedFiles.value = 0;

      for (let i = 0, l = filesUpload.length; i < l; i++) {
        const fd = new FormData();
        console.debug(`upload::${filesUpload[i].name}`);
        fd.append('file', filesUpload[i]);
        await new Promise((resolve) => {
          api.post<FormData, string>(ctx.root.$axios, '/api/v1/carousel/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
            .then((id) => {
              console.debug(`done::${filesUpload[i].name}::${id}`);
              api.getOne<CarouselInterface>(ctx.root.$axios, `/api/v1/carousel`, id)
                .then((response) => {
                  console.debug('Uploaded', response.data.id);
                  uploadedFiles.value++;
                  items.value.push(response.data);
                  resolve(true);
                })
                .catch((err) => {
                  error(err);
                  resolve(false);
                });
            })
            .catch((err) => {
              error(err);
              resolve(false);
            });
        });
      }
    };

    return {
      // refs
      timestamp,
      update,
      items,
      search,
      state,
      headers,
      selected,
      deleteSelected,
      selectable,
      deleteDialog,
      translate,
      saveSuccess,
      rules,

      // functions
      addToSelectedItem: addToSelectedItem(selected, 'id', currentItems),
      filesChange,
      handleDragStart,

      // icons
      mdiMagnify,
      mdiCheckBoxMultipleOutline,
      mdiDrag,
      ButtonStates,

      // external functions
      saveCurrentItems,
      dayjs,
    };
  },
});
</script>
