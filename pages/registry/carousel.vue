<template>
  <v-container
    fluid
    :class="{ 'pa-4': !$vuetify.breakpoint.mobile }"
  >
    <v-data-table
      v-model="selected"
      calculate-widths
      :show-select="selectable"
      :search="search"
      :loading="loading || saving"
      :headers="headers"
      :items-per-page="-1"
      hide-default-footer
      :items="items"
      sort-by="order"
      @current-items="saveCurrentItems"
      @click:row="addToSelectedItem"
    >
      <template #top>
        <v-sheet
          flat
          color="dark"
          class="my-2 pb-2 mt-0"
        >
          <v-row class="px-2" no-gutters>
            <v-col cols="auto" align-self="center" class="pr-2">
              <v-btn icon :color="selectable ? 'primary' : 'secondary'" @click="selectable = !selectable">
                <v-icon>
                  mdi-checkbox-multiple-marked-outline
                </v-icon>
              </v-btn>
            </v-col>
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
                    />
                  </form>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-sheet>
      </template>

      <template #[`item.showOnlyOncePerStream`]="{ item }">
        <v-simple-checkbox

          v-model="item.showOnlyOncePerStream"
          @click="update(item, true, 'showOnlyOncePerStream')"
        />
      </template>

      <template #[`item.drag`]="{ item }">
        <template v-if="$vuetify.breakpoint.mobile">
          <v-icon v-if="item.order !== 0" @click.stop="swapOrder(item.order, item.order - 1)">
            mdi-chevron-up
          </v-icon>
          <v-icon v-if="item.order !== items.length - 1" @click.stop="swapOrder(item.order, item.order + 1)">
            mdi-chevron-down
          </v-icon>
        </template>
        <v-icon v-else :disabled="state.dragging || saving" @mousedown.prevent="handleDragStart($event, item.id)">
          mdi-drag
        </v-icon>
      </template>

      <template #[`item.waitBefore`]="{ item }">
        <v-edit-dialog

          persistent
          large
          :return-value.sync="item.waitBefore"
          @save="update(item, true, 'waitBefore')"
        >
          {{ item.waitBefore }}
          <template #input>
            <v-text-field
              v-model="item.waitBefore"
              :rules="rules.waitBefore"
              single-line
              counter
            >
              <template #append>
                ms
              </template>
            </v-text-field>
          </template>
        </v-edit-dialog>
      </template>

      <template #[`item.waitAfter`]="{ item }">
        <v-edit-dialog

          persistent
          large
          :return-value.sync="item.waitAfter"
          @save="update(item, true, 'waitAfter')"
        >
          {{ item.waitAfter }}
          <template #input>
            <v-text-field
              v-model="item.waitAfter"
              :rules="rules.waitAfter"
              single-line
              counter
            >
              <template #append>
                ms
              </template>
            </v-text-field>
          </template>
        </v-edit-dialog>
      </template>

      <template #[`item.duration`]="{ item }">
        <v-edit-dialog

          persistent
          large
          :return-value.sync="item.duration"
          @save="update(item, true, 'duration')"
        >
          {{ item.duration }}
          <template #input>
            <v-text-field
              v-model="item.duration"
              :rules="rules.duration"
              single-line
              counter
            >
              <template #append>
                ms
              </template>
            </v-text-field>
          </template>
        </v-edit-dialog>
      </template>

      <template #[`item.animationInDuration`]="{ item }">
        <v-edit-dialog

          persistent
          large
          :return-value.sync="item.animationInDuration"
          @save="update(item, true, 'animationInDuration')"
        >
          {{ item.animationInDuration }}
          <template #input>
            <v-text-field
              v-model="item.animationInDuration"
              :rules="rules.animationInDuration"
              single-line
              counter
            >
              <template #append>
                ms
              </template>
            </v-text-field>
          </template>
        </v-edit-dialog>
      </template>

      <template #[`item.animationIn`]="{ item }">
        <v-edit-dialog

          persistent
          large
          :return-value.sync="item.animationIn"
          @save="update(item, true, 'animationIn')"
        >
          {{ item.animationIn }}
          <template #input>
            <v-select
              v-model="item.animationIn"
              :items="animationInOptions"
            />
          </template>
        </v-edit-dialog>
      </template>

      <template #[`item.animationOutDuration`]="{ item }">
        <v-edit-dialog

          persistent
          large
          :return-value.sync="item.animationOutDuration"
          @save="update(item, true, 'animationOutDuration')"
        >
          {{ item.animationOutDuration }}
          <template #input>
            <v-text-field
              v-model="item.animationOutDuration"
              :rules="rules.animationOutDuration"
              single-line
              counter
            >
              <template #append>
                ms
              </template>
            </v-text-field>
          </template>
        </v-edit-dialog>
      </template>

      <template #[`item.animationOut`]="{ item }">
        <v-edit-dialog

          persistent
          large
          :return-value.sync="item.animationOut"
          @save="update(item, true, 'animationOut')"
        >
          {{ item.animationOut }}
          <template #input>
            <v-select
              v-model="item.animationOut"
              :items="animationOutOptions"
            />
          </template>
        </v-edit-dialog>
      </template>

      <template #[`item.image`]="{ item }">
        <v-img
          :id="item.id"
          contain
          :src="`/api/v2/carousel/image/${item.id}`"
          max-height="75px"
          max-width="150px"
          @click.stop="imageShow = `/api/v2/carousel/image/${item.id}`"
        />
      </template>

      <template #[`body.append`]>
        <tr v-if="state.dragging">
          <td colspan="10" style="height: 10px;" />
        </tr>
      </template>
    </v-data-table>

    <v-overlay v-model="imageShowOverlay" @click.native="closeOverlay">
      <v-progress-circular
        v-if="isImageLoading"
        indeterminate
        color="primary darken-1"
        size="128"
        style="position: fixed;
          left: 50%;
          top: 50%;
          transform: translateX(-50%), translateY(-50%);"
      />
      <v-img
        v-if="imageShow"
        contain
        :src="imageShow"
        @load="isImageLoading = false"
      />
    </v-overlay>
  </v-container>
</template>

<script lang="ts">
import {
  defineComponent, onMounted, ref, watch,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import translate from '@sogebot/ui-helpers/translate';
import {
  useMutation, useQuery, useResult,
} from '@vue/apollo-composable';
import { cloneDeep, sortBy } from 'lodash';

import { error } from '../../functions/error';

import type { CarouselInterface } from '@entity/carousel';
import { addToSelectedItem } from '~/functions/addToSelectedItem';
import { EventBus } from '~/functions/event-bus';
import { getBase64FromUrl } from '~/functions/getBase64FromURL';
import { minValue, required } from '~/functions/validators';
import GET_ALL from '~/queries/carousel/getAll.gql';
import REMOVE from '~/queries/carousel/remove.gql';
import SAVE from '~/queries/carousel/save.gql';
import UPLOAD from '~/queries/carousel/upload.gql';

const originalWidths: string[] = [];
let originalHeight = 0;

function handleDragStart (e: DragEvent, id: string) {
  EventBus.$emit(`carousel::dragstart`);
  // we want to select first tr
  let element: HTMLElement;
  for (const el of (e as any).path as unknown as HTMLElement[]) {
    if (el.tagName === 'TR') {
      element = el;

      // set widths
      originalWidths.length = 0;
      for (const cell of element.children) {
        originalWidths.push(`${parseInt(window.getComputedStyle(cell).width)}px`);
      }
      originalHeight = Number(window.getComputedStyle(element).height.replace('px', '')) + 10;
      document.onmouseup = handleDragEnd;
      break;
    }
  }
  // enable mouse move listener
  function elementDrag (ev: MouseEvent) {
    for (let i = 0; i < element.children.length; i++) {
      // Set the width as the original cell
      (element.children[i] as HTMLElement).style.maxWidth = originalWidths[i];
      (element.children[i] as HTMLElement).style.minWidth = originalWidths[i];
      (element.children[i] as HTMLElement).style.overflow = 'hidden';
    }
    // we need to dynamically move elements up if reached bottom
    element.style.opacity = '0.8';
    element.style.zIndex = String(9999);
    element.style.top = (ev.clientY + originalHeight - 100) + 'px';
    element.style.left = (ev.clientX + 5) + 'px';
    element.style.position = 'fixed';
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
        EventBus.$emit(`carousel::dragdrop`, {
          id, offsetId,
        });
      } catch {
        EventBus.$emit(`carousel::dragdrop`, {
          id,
        });
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
  setup () {
    const { result, loading, refetch } = useQuery(GET_ALL);
    const cache = useResult<{ carousels: CarouselInterface[] }, null, CarouselInterface[]>(result, null, data => data.carousels);
    watch(cache, (value) => {
      console.log({
        value,
      });
      if (!value) {
        return;
      }
      items.value = cloneDeep([...value]);
    }, {
      immediate: true, deep: true,
    });

    const { mutate: uploadMutation, onDone: onDoneUpload } = useMutation(UPLOAD);
    onDoneUpload((res) => {
      console.debug('Uploaded', res);
      uploadedFiles.value++;
      refetch();
    });

    const { mutate: saveMutation, onDone: onDoneSave, loading: saving } = useMutation(SAVE, {
      refetchQueries: ['CarouselGetAll'],
    });
    onDoneSave(() => {
      EventBus.$emit('snack', 'success', 'Data saved.');
    });

    const { mutate: removeMutation, onError: onErrorRemove } = useMutation(REMOVE, {
      refetchQueries: ['CarouselGetAll'],
    });
    onErrorRemove(error);

    const items = ref([] as CarouselInterface[]);

    const imageShowOverlay = ref(false);
    const imageShow = ref(null as null | string);
    const isImageLoading = ref(false);

    const search = ref('');
    const rules = {
      waitBefore:           [required, minValue(0)],
      waitAfter:            [required, minValue(0)],
      duration:             [required, minValue(0)],
      animationOutDuration: [required, minValue(0)],
      animationInDuration:  [required, minValue(0)],
    };
    const timestamp = ref(Date.now());

    const animationInOptions = [
      {
        value: 'fadeIn', text: 'fadeIn',
      },
      {
        value: 'blurIn', text: 'blurIn',
      },
      {
        value: 'slideUp', text: 'slideUp',
      },
      {
        value: 'slideDown', text: 'slideDown',
      },
      {
        value: 'slideLeft', text: 'slideLeft',
      },
      {
        value: 'slideRight', text: 'slideRight',
      },
    ];

    const animationOutOptions = [
      {
        value: 'fadeOut', text: 'fadeOut',
      },
      {
        value: 'blurOut', text: 'blurOut',
      },
      {
        value: 'slideUp', text: 'slideUp',
      },
      {
        value: 'slideDown', text: 'slideDown',
      },
      {
        value: 'slideLeft', text: 'slideLeft',
      },
      {
        value: 'slideRight', text: 'slideRight',
      },
    ];

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
      dragging: false, uploading: ButtonStates.idle,
    } as {
      uploading: number;
      dragging: boolean;
    });

    const headers = [
      {
        value: 'drag', text: '', sortable: false,
      },
      {
        value: 'image', text: '', sortable: false, align: 'center',
      },
      {
        value: 'waitBefore', text: translate('page.settings.overlays.carousel.titles.waitBefore'), sortable: false,
      },
      {
        value: 'waitAfter', text: translate('page.settings.overlays.carousel.titles.waitAfter'), sortable: false,
      },
      {
        value: 'duration', text: translate('page.settings.overlays.carousel.titles.duration'), sortable: false,
      },
      {
        value: 'animationInDuration', text: translate('page.settings.overlays.carousel.titles.animationInDuration'), sortable: false,
      },
      {
        value: 'animationIn', text: translate('page.settings.overlays.carousel.titles.animationIn'), sortable: false,
      },
      {
        value: 'animationOutDuration', text: translate('page.settings.overlays.carousel.titles.animationOutDuration'), sortable: false,
      },
      {
        value: 'animationOut', text: translate('page.settings.overlays.carousel.titles.animationOut'), sortable: false,
      },
      {
        value: 'showOnlyOncePerStream', text: translate('page.settings.overlays.carousel.titles.showOnlyOncePerStream'), sortable: false,
      },
    ];

    watch(imageShowOverlay, (val) => {
      if (!val) {
        imageShow.value = null;
      }
    });
    watch(imageShow, (val) => {
      if (val !== null) {
        imageShowOverlay.value = true;
        isImageLoading.value = true;
      }
    });

    onMounted(() => {
      refetch();
      EventBus.$off(`carousel::dragdrop`).$off(`carousel::dragstart`);
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
            items.value.push({
              ...draggedItem, order: items.value.length,
            });
          }
          reorder();
        }
      });
    });

    const reorder = () => {
      // reorder
      for (let i = 0; i < items.value.length; i++) {
        items.value[i].order = i;
      }
      items.value.forEach(item => saveMutation({
        data_json: JSON.stringify({
          id: item.id, order: item.order,
        }),
      }));
    };

    const saveSuccess = () => {
      refetch();
      EventBus.$emit('snack', 'success', 'Data updated.');
    };

    const deleteSelected = () => {
      deleteDialog.value = false;
      selected.value.forEach((item) => {
        removeMutation({
          id: item.id,
        });
      });

      EventBus.$emit('snack', 'success', 'Data removed.');
      selected.value = [];
    };

    const update = (item: typeof items.value[number], multi = false, attr: keyof typeof items.value[number]) => {
      // check validity
      for (const key of Object.keys(rules)) {
        for (const rule of (rules as any)[key]) {
          const ruleStatus = rule((item as any)[key]);
          if (ruleStatus === true) {
            continue;
          } else {
            EventBus.$emit('snack', 'red', `[${key}] - ${ruleStatus}`);
            refetch();
            return;
          }
        }
      }

      // update all instantly
      for (const i of [item, ...(multi ? selected.value : [])]) {
        (i as any)[attr] = item[attr];
      }

      [item, ...(multi ? selected.value : [])].forEach((itemToUpdate) => {
        console.log('Updating', {
          itemToUpdate,
        }, {
          attr, value: item[attr],
        });
        saveMutation({
          data_json: JSON.stringify({
            itemToUpdate,
            [attr]: item[attr],
          }),
        });
      });
    };

    const filesChange = async (filesUpload: HTMLInputElement['files']) => {
      if (!filesUpload) {
        return;
      }
      // state.value.uploading = ButtonStates.progress;
      isUploadingNum.value = filesUpload.length;
      uploadedFiles.value = 0;

      for (const file of filesUpload) {
        const type = file.type;
        const base64 = (await getBase64FromUrl(URL.createObjectURL(file))).split(',')[1];
        uploadMutation({
          data_json: JSON.stringify({
            type, base64,
          }),
        });
      }
    };

    const swapOrder = (order1: number, order2: number) => {
      const item1 = items.value.find(o => o.order === order1);
      const item2 = items.value.find(o => o.order === order2);
      if (item1 && item2) {
        item1.order = order2;
        item2.order = order1;
      }
      items.value = sortBy(items.value, 'order', 'ASC');
      reorder();
    };

    function closeOverlay () {
      imageShowOverlay.value = false;
    }

    return {
      // refs
      loading,
      saving,
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
      imageShowOverlay,
      imageShow,
      isImageLoading,
      animationInOptions,
      animationOutOptions,

      // functions
      addToSelectedItem: addToSelectedItem(selected, 'id', currentItems),
      filesChange,
      handleDragStart,
      closeOverlay,
      swapOrder,

      ButtonStates,

      // external functions
      saveCurrentItems,
      dayjs,
    };
  },
});
</script>
