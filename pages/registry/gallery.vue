<template>
  <v-container
    fluid
    :class="{ 'pa-4': !$vuetify.breakpoint.mobile }"
  >
    <h2 v-if="!$vuetify.breakpoint.mobile">
      {{ translate('menu.gallery') }}
    </h2>

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
        <v-col>
          <v-text-field
            v-model="search"
            label="Search"
            multiple
            class="pr-2"
          />
        </v-col>

        <v-col cols="auto" align-self="center">
          <template v-if="selected.length > 0">
            <v-dialog
              v-model="folderMultiDialog"
              max-width="500px"
            >
              <template #activator="{ on, attrs }">
                <v-btn
                  color="primary"
                  class="mr-1"
                  v-bind="attrs"
                  v-on="on"
                >
                  Change folder of {{ selected.length }} Item(s)
                </v-btn>
              </template>

              <v-card>
                <v-card-title>
                  <span class="headline">Change folder of {{ selected.length }} Item(s)</span>
                </v-card-title>
                <v-card-text>
                  <v-text-field
                    v-model="newFolder"
                    single-line
                    label="Folder"
                    counter
                  />
                </v-card-text>
                <v-card-actions>
                  <v-btn
                    text
                    @click="folderMultiDialog = false"
                  >
                    Cancel
                  </v-btn>
                  <v-spacer />
                  <v-btn
                    color="primary"
                    text
                    :loading="state.folder === ButtonStates.progress"
                    @click="changeFolder(null)"
                  >
                    Yes, change
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </template>
        </v-col>

        <v-col cols="auto" align-self="center">
          <template v-if="selected.length > 0">
            <v-dialog
              v-model="deleteMultiDialog"
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
                  <v-btn
                    text
                    @click="deleteMultiDialog = false"
                  >
                    Cancel
                  </v-btn>
                  <v-spacer />
                  <v-btn
                    color="error"
                    text
                    :loading="state.loading === ButtonStates.progress"
                    @click="deleteItem(null)"
                  >
                    Yes, Delete
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </template>
        </v-col>

        <v-col cols="auto" align-self="center">
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
              :disabled="state.uploading === ButtonStates .progress"
              multiple
              accept="image/*, video/mp4, audio/*"
              @change="filesChange($event.target.files)"
            >
          </form>
        </v-col>
      </v-row>
    </v-sheet>

    <v-row>
      <v-col>
        <v-card :loading="state.loading !== ButtonStates.success">
          <v-card-text>
            <v-treeview
              :key="state.loading + 'treeview'"
              v-model="selected"
              selection-type="leaf"
              :selectable="selectable"
              :items="itemsTree"
              transition
              :active.sync="active"
              activatable
              :open.sync="opened"
              :search="search"
              dense
              item-key="id"
              open-on-click
            >
              <template #prepend="{ item, open }">
                <v-icon v-if="!item.file">
                  {{ open ? mdiFolderOpen : mdiFolder }}
                </v-icon>
                <v-icon v-else>
                  {{ files[item.file.split('/')[0]] }}
                </v-icon>
              </template>
            </v-treeview>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col v-if="activeItem" :key="activeItem.id" cols="12" md="5">
        <v-card>
          <v-card-title class="headline">
            {{ activeItem.name }}
          </v-card-title>
          <v-card-text v-if="activeItem">
            <v-icon v-if="activeItem.type.includes('audio')" size="125" class="text-center d-block ma-auto">
              {{ mdiFileMusic }}
            </v-icon>
            <v-img v-else-if="activeItem.type.includes('image')" :src="activeItem.link" />

            <video
              v-if="activeItem.type.includes('mp4')"
              style="width: 100%;"
              controls
            >
              <source
                :type="activeItem.type"
                :src="activeItem.link"
              >
            </video>
            <audio
              v-if="activeItem.type.includes('audio')"
              style="width: 100%;"
              controls
            >
              <source
                :type="activeItem.type"
                :src="activeItem.link"
              >
            </audio>

            <v-list dense class="dense">
              <v-list-item>
                <strong>Filename:</strong>&nbsp;{{ activeItem.name }}
              </v-list-item>
              <v-list-item>
                <strong>Filetype:</strong>&nbsp;{{ activeItem.type }}
              </v-list-item>
              <v-list-item v-if="activeItem.type.includes('image') || activeItem.type.includes('video')">
                <strong>Dimensions:</strong>&nbsp;
                <v-progress-circular v-if="activeItem.width === 0 || activeItem.height === 0" indeterminate size="20" />
                <span v-else>{{ activeItem.width }}x{{ activeItem.height }}</span>
              </v-list-item>
              <v-list-item v-if="activeItem.type.includes('audio') || activeItem.type.includes('video')">
                <strong>Duration:</strong>&nbsp;
                <v-progress-circular v-if="activeItem.duration === 0" indeterminate size="20" />
                <span v-else>{{ activeItem.duration }}s</span>
              </v-list-item>
              <v-list-item>
                <strong>Link:</strong>&nbsp;
                <a :href="activeItem.link">{{ activeItem.link }}</a>
              </v-list-item>
            </v-list>
            <v-card-actions>
              <v-dialog
                v-model="deleteDialog"
                width="500"
              >
                <template #activator="{ on, attrs }">
                  <v-btn
                    color="error"
                    text
                    v-bind="attrs"
                    v-on="on"
                  >
                    Delete
                  </v-btn>
                </template>

                <v-card>
                  <v-card-title class="headline">
                    Do you want to delete this item?
                  </v-card-title>

                  <v-divider />

                  <v-card-actions>
                    <v-btn
                      text
                      @click="deleteDialog = false"
                    >
                      Cancel
                    </v-btn>
                    <v-spacer />
                    <v-btn
                      color="error"
                      text
                      :loading="state.loading === ButtonStates.progress"
                      @click="deleteItem(activeItem.id)"
                    >
                      Yes, delete
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>

              <v-dialog
                v-model="folderDialog"
                width="500"
              >
                <template #activator="{ on, attrs }">
                  <v-btn
                    color="primary"
                    text
                    v-bind="attrs"
                    v-on="on"
                  >
                    Change folder
                  </v-btn>
                </template>

                <v-card>
                  <v-card-title class="headline">
                    Change folder
                  </v-card-title>

                  <v-divider />

                  <v-card-text>
                    <v-text-field
                      v-model="newFolder"
                      single-line
                      label="Folder"
                      counter
                    />
                  </v-card-text>

                  <v-card-actions>
                    <v-btn
                      text
                      @click="folderDialog = false"
                    >
                      Cancel
                    </v-btn>
                    <v-spacer />
                    <v-btn
                      color="primary"
                      text
                      :loading="state.folder === ButtonStates.progress"
                      @click="changeFolder(activeItem.id)"
                    >
                      Yes, change it
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>
            </v-card-actions>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { normalize } from 'path';

import {
  mdiCheckBoxMultipleOutline, mdiFileImage, mdiFileMusic, mdiFileVideo, mdiFolder, mdiFolderOpen, mdiLink, mdiThumbUp,
} from '@mdi/js';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  computed,
  defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';
import { uniq } from 'lodash';
import { v4 as uuid } from 'uuid';

import type { GalleryInterface } from '.bot/src/bot/database/entity/gallery';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';

const files = {
  audio: mdiFileMusic, video: mdiFileVideo, image: mdiFileImage,
};

export default defineComponent({
  setup () {
    const search = ref('');

    const items = ref([] as GalleryInterface[]);
    const active = ref([] as string[]);
    const opened = ref([] as string[]);
    const selected = ref([] as string[]);

    const selectable = ref(false);
    watch(selectable, (val) => {
      if (!val) {
        selected.value = [];
      }
    });

    const uploadedFiles = ref(0);
    const isUploadingNum = ref(0);

    const deleteDialog = ref(false);
    const deleteMultiDialog = ref(false);
    const folderDialog = ref(false);
    const folderMultiDialog = ref(false);

    const imageWidth = ref(0);
    const imageHeight = ref(0);
    const duration = ref(0);

    const newFolder = ref('');
    watch([folderDialog, folderMultiDialog], (val) => {
      if (val) {
        newFolder.value = activeItem.value?.folder ?? '/';
      }
    });

    const state = ref({
      loading:   ButtonStates.progress,
      uploading: ButtonStates.idle,
      folder:    ButtonStates.idle,
      delete:    ButtonStates.idle,
    } as {
      uploading: number;
      loading: number;
      folder: number;
      delete: number;
    });

    onMounted(() => {
      refresh();
    });

    const getDirectoriesOf = (directories: string[]) => {
      const folders = items.value.map(o => o.folder.split('/').filter(Boolean));

      // get first level
      const firstLevelFolder = [];
      for (const f of folders) {
        // check if valid
        let valid = f.length > 0;
        for (let i = 0; i < directories.length; i++) {
          try {
            if (f[i] !== directories[i]) {
              valid = false;
            }
          } catch (e) {
            valid = false;
            break;
          }
        }
        if (valid && f[directories.length]) {
          firstLevelFolder.push(f[directories.length]);
        }
      }
      return (uniq(firstLevelFolder)).sort();
    };

    const getChildrenOf = (directories?: string[]): any => {
      directories = directories || [];
      const childDirectories = getDirectoriesOf(directories);
      return {
        id:       directories.length === 0 ? 'Gallery' : directories[directories.length - 1],
        name:     directories.length === 0 ? 'Gallery' : directories[directories.length - 1],
        children: [
          ...childDirectories.map((o) => {
            return getChildrenOf([...(directories ?? []), o]);
          }),
          ...items.value
            .filter((o) => {
              directories = directories || [];
              let directory = directories.join('/').length === 0 ? '/' : directories.join('/');
              directory = directory[0] !== '/' ? '/' + directory : directory;
              const directory2 = o.folder[0] !== '/' ? '/' + o.folder : o.folder;
              return directory2 === directory;
            })
            .map(o => ({
              id:   o.id,
              name: o.name,
              file: o.type,
            })),
        ],
      };
    };

    const itemsTree = computed(() => {
      return [getChildrenOf()];
    });

    watch(active, () => {
      imageWidth.value = 0;
      imageHeight.value = 0;
      duration.value = 0;
    }, { deep: true });

    watch(uploadedFiles, (val: number) => {
      if (isUploadingNum.value === val) {
        state.value.uploading = ButtonStates.idle;
      } else {
        state.value.uploading = ButtonStates.progress;
      }
    });

    const refresh = () => {
      getSocket('/overlays/gallery').emit('generic::getAll', (err: string | null, _items: GalleryInterface[]) => {
        if (err) {
          error(err);
          return;
        }
        console.debug('Loaded', _items);
        items.value.length = 0;
        for (const item of _items) {
          items.value.push({
            ...item,
            folder: normalizePath(item.folder),
          });
        }
        state.value.loading = ButtonStates.success;
        opened.value = opened.value.length === 0 ? ['Gallery'] : opened.value;
      });
    };

    const filesChange = (filesUpload: HTMLInputElement['files']) => {
      if (!filesUpload) {
        return;
      }
      state.value.uploading = ButtonStates.progress;
      isUploadingNum.value = filesUpload.length;
      uploadedFiles.value = 0;

      for (let i = 0, l = filesUpload.length; i < l; i++) {
        const reader = new FileReader();
        reader.onload = async () => {
          const id = uuid();
          const chunks = String(reader.result).match(/.{1,500000}/g);
          if (!chunks) {
            return;
          }
          for (let j = 0; j < chunks.length; j++) {
            // upload one by one to have full file
            await new Promise((resolve) => {
              console.debug(`upload::${filesUpload[i].name}::chunk::${j}`);
              getSocket('/overlays/gallery').emit('gallery::upload', [filesUpload[i].name, {
                id,
                b64data: chunks[j],
              }], (err: string | null) => {
                if (err) {
                  return error(err);
                }
                console.debug(`done::${filesUpload[i].name}::chunk::${j}`);
                resolve(true);
              });
            });
          }
          uploadedFiles.value++;
          getSocket('/overlays/gallery').emit('generic::getOne', id, (err: string | null, _item: GalleryInterface) => {
            if (err) {
              error(err);
              return;
            }
            console.debug('Uploaded', _item);
            items.value.push(_item);
          });
        };
        reader.readAsDataURL(filesUpload[i]);
      }
    };

    const activeItem = computed(() => {
      if (active.value.length > 0) {
        const item = items.value.find(o => o.id === active.value[0]);
        if (item) {
          return {
            ...item,
            width:    imageWidth.value,
            height:   imageHeight.value,
            duration: duration.value,
            link:     (process.env.isNuxtDev ? 'http://localhost:20000/gallery/' : location.origin + '/gallery/') + item.id,
          };
        }
      }
      return null;
    });

    watch(activeItem, (val) => {
      if (val) {
        if (val.type.includes('image')) {
          const img = new Image();
          img.addEventListener('load', function () {
            imageWidth.value = this.naturalWidth;
            imageHeight.value = this.naturalHeight;
          });
          img.src = val.link;
        } else if (val.type.includes('audio')) {
          const audio = new Audio();
          audio.addEventListener('loadedmetadata', function () {
            duration.value = this.duration;
          });
          audio.src = val.link;
        } else if (val.type.includes('video')) {
          const video = document.createElement('video');
          video.addEventListener('loadedmetadata', function () {
            imageWidth.value = this.videoWidth;
            imageHeight.value = this.videoHeight;
            duration.value = this.duration;
          });
          video.src = val.link;
        }
      }
    });

    const deleteItem = async (id: string | null) => {
      state.value.delete = ButtonStates.progress;
      const toDelete = id !== null ? [id] : selected.value;
      await Promise.all(
        toDelete.map((_id) => {
          return new Promise((resolve, reject) => {
            console.log('Deleting', _id);
            getSocket('/overlays/gallery').emit('generic::deleteById', _id, (err: string | null) => {
              if (err) {
                reject(error(err));
              }
              items.value = items.value.filter(o => o.id !== _id);
              resolve(true);
            });
          });
        }),
      );
      refresh();

      EventBus.$emit('snack', 'success', 'Data removed.');
      selected.value = [];
      active.value = [];
      state.value.delete = ButtonStates.idle;
      deleteDialog.value = false;
      deleteMultiDialog.value = false;
    };

    const normalizePath = (path: string) => {
      // normalize path
      path = normalize(path);

      // remove . if path is empty
      if (path[0] === '.') {
        path = path.replace('.', '');
      }

      // add leading slash
      if (path[0] !== '/') {
        path = '/' + path;
      }

      // remove trailing slash
      path = path.replace(/\/+$/, '');
      return path;
    };

    const changeFolder = async (id: string) => {
      state.value.folder = ButtonStates.progress;
      newFolder.value = normalizePath(newFolder.value);

      const toUpdate = id !== null ? [id] : selected.value;
      await Promise.all(
        toUpdate.map((_id) => {
          return new Promise((resolve, reject) => {
            getSocket('/overlays/gallery').emit('generic::setById', {
              id:   _id,
              item: { folder: newFolder.value },
            }, (err: string | null) => {
              if (err) {
                reject(error(err));
              }
              resolve(true);
            });
          });
        }),
      );
      refresh();

      EventBus.$emit('snack', 'success', 'Data updated.');
      selected.value = [];
      active.value = [];
      state.value.folder = ButtonStates.idle;
      folderDialog.value = false;
      folderMultiDialog.value = false;
    };

    return {
      search,
      state,
      items,
      selected,
      filesChange,
      active,
      activeItem,
      duration,
      newFolder,
      changeFolder,
      opened,
      selectable,

      deleteDialog,
      deleteMultiDialog,
      folderDialog,
      folderMultiDialog,
      deleteItem,
      isUploadingNum,
      uploadedFiles,
      translate,

      files,
      itemsTree,

      mdiFolder,
      mdiFolderOpen,
      mdiFileMusic,
      mdiLink,
      mdiThumbUp,
      mdiCheckBoxMultipleOutline,
      ButtonStates,
    };
  },
});
</script>

<style scoped>
.dense .v-list-item {
  min-height: 25px !important;
}
</style>
