<template>
  <div>
    <v-treeview
      selection-type="independent"
      :items="itemsTree"
      transition
      :active.sync="active"
      :activatable="type !== 'audio'"
      :open.sync="opened"
      dense
      item-key="id"
      open-on-click
    >
      <template #prepend="{ item, open }">
        <v-icon v-if="!item.file">
          {{ open ? 'mdi-folder-open' : 'mdi-folder' }}
        </v-icon>
        <template v-else>
          <div class="d-flex">
            <v-icon left>
              {{ files[item.file.split('/')[0]] }}
            </v-icon>
            <v-simple-checkbox :value="model === item.id" @click="model === item.id ? model = null : model = item.id" />
          </div>
        </template>
      </template>
      <template #label="{ item }">
        <v-tooltip v-if="hoverItem(item) && !hoverItem(item).type.includes('audio')" bottom>
          <template #activator="{ on, attrs }">
            <span v-bind="attrs" v-on="on">
              {{ item.name }}
            </span>
          </template>
          <div>
            <v-img v-if="hoverItem(item).type.includes('image')" :src="hoverItem(item).link" class="player" max-height="300" max-width="300" />
            <video
              v-if="hoverItem(item).type.includes('video')"
              style="max-width: 300px; max-height: 300px;"
            >
              <source
                :type="hoverItem(item).type"
                :src="hoverItem(item).link"
              >
            </video>
          </div>
        </v-tooltip>
        <template v-else>
          {{ item.name }}

          <template v-if="hoverItem(item) && hoverItem(item).type.includes('audio')">
            <v-progress-circular v-if="!loadedItems.includes(item.id)" indeterminate size="16" />
            <template v-else>
              <v-btn icon small @click.stop="playItem(item)">
                <v-icon v-if="playingItems.includes(item.id)">
                  mdi-pause
                </v-icon>
                <v-icon v-else>
                  mdi-play
                </v-icon>
              </v-btn>

              <small class="secondary--text text--lighten-3">{{ Math.floor(audioData(item.id).duration * 100) / 100 }}s</small>
            </template>
          </template>
        </template>
      </template>
    </v-treeview>

    <div class="text-center pt-4">
      <form
        enctype="multipart/form-data"
        novalidate
      >
        <v-btn
          color="primary"
          :loading="uploading"
          small
          @click="$refs.uploadFileInput.click()"
        >
          Upload item
        </v-btn>
        <v-btn v-if="type !== 'audio'" small @click="showInfo = !showInfo">
          Show info
        </v-btn>
        <input
          ref="uploadFileInput"
          class="d-none input-file"
          type="file"
          :disabled="uploading"
          multiple
          :accept="type === 'image' ? 'image/*' : 'video/mp4, audio/*'"
          @change="filesChange($event.target.files)"
        >
      </form>
    </div>

    <v-card v-if="activeItem && showInfo">
      <v-card-title class="headline">
        {{ activeItem.name }}
      </v-card-title>
      <v-card-text v-if="activeItem">
        <v-icon v-if="activeItem.type.includes('audio')" size="125" class="text-center d-block ma-auto">
          mdi-file-music
        </v-icon>
        <v-img v-else-if="activeItem.type.includes('image')" :src="activeItem.link" class="player" />

        <video
          v-if="activeItem.type.includes('video')"
          class="player"
          style="width: 100%;"
          controls
          :loop="_loop"
        >
          <source
            :type="activeItem.type"
            :src="activeItem.link"
          >
        </video>
        <audio
          v-if="activeItem.type.includes('audio')"
          class="player"
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
          <v-list-item v-if="!activeItem.link.startsWith('data')">
            <strong>Link:</strong>&nbsp;
            <a :href="activeItem.link">{{ activeItem.link }}</a>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <v-switch
      v-model="_loop"
      class="pb-2"
      hide-details="auto"
      :label="translate('registry.alerts.loop.name')"
    />
  </div>
</template>

<script lang="ts">
import { normalize } from 'path';

import {
  computed,
  defineComponent, nextTick, onMounted, ref, watch,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { uniq } from 'lodash';
import shortid from 'shortid';

import { error } from '../../../../functions/error';

import { GalleryInterface } from '@entity/gallery';

const defaultTypes = {
  image: 'image/gif',
  audio: 'audio/mp3',
};

interface Props {
  value: string | null; default?: string; type: 'image' | 'audio'; volume: number; loop: boolean;
}

const files = {
  audio: 'mdi-file-music', video: 'mdi-file-video', image: 'mdi-file-image',
};

const audioElements = new Map<string, { audio: HTMLAudioElement, duration: number }>();

export default defineComponent({
  props: {
    value:   String,
    default: String,
    type:    String,
    volume:  Number,
    loop:    Boolean,
  },
  setup (props: Props, ctx) {
    const loading = ref(false);
    const uploading = ref(false);

    const mediaType = ref(props.type as 'image' | 'video' | 'audio');
    const model = ref(props.value as string | null);
    const items = ref([] as GalleryInterface[]);

    const loadedItems = ref([] as string[]);
    const playingItems = ref([] as string[]);

    const opened = ref([] as string[]);
    const active = ref([] as string[]);

    const imageWidth = ref(0);
    const imageHeight = ref(0);
    const duration = ref(0);
    const showInfo = ref(false);

    const uploadedFiles = ref(0);
    const isUploadingNum = ref(0);

    watch(uploadedFiles, (val: number) => {
      if (isUploadingNum.value === val) {
        uploading.value = false;
      } else {
        uploading.value = true;
      }
    });

    const src = ref(null as null | string);

    const _loop = ref(props.loop);
    watch(_loop, (val) => {
      ctx.emit('update:loop', val);
    });

    watch(model, (val) => {
      ctx.emit('input', val || null);
    });

    watch(showInfo, () => {
      setVolume();
    });

    const setVolume = () => {
      nextTick(() => {
        const els = Array.from(document.getElementsByClassName('player')) as HTMLAudioElement[];
        for (const el of els) {
          el.volume = props.volume / 100;
        }
      });
    };

    onMounted(() => {
      refresh();
    });

    const refresh = () => {
      loading.value = true;
      getSocket('/overlays/gallery').emit('generic::getAll', (err: string | null, _items: GalleryInterface[]) => {
        if (err) {
          error(err);
          return;
        }
        console.debug('Loaded', _items);
        items.value.length = 0;
        for (const item of _items) {
          if ((props.type === 'audio' && !item.type.startsWith('audio'))
          || (props.type === 'image' && !item.type.startsWith('image') && !item.type.startsWith('video'))) {
            continue;
          }
          items.value.push({
            ...item,
            folder: normalizePath(item.folder),
          });
        }
        loading.value = false;

        const item = items.value.find(o => o.id === props.value);
        if (item) {
          opened.value = item.folder.split('/');
        }

        if (props.type === 'audio') {
          for (const audioItem of [{
            id: '_default_',
          }, ...items.value]) {
            if (!audioItem.id) {
              break;
            }

            const link = audioItem.id === '_default_'
              ? `${location.origin}/gallery/_default_${props.type}`
              : location.origin + '/gallery/' + audioItem?.id;

            const audio = new Audio();
            audio.addEventListener('play', () => {
              if (audioItem.id) {
                playingItems.value.push(audioItem.id);
              }
            });
            audio.addEventListener('pause', () => {
              if (audioItem.id) {
                playingItems.value = playingItems.value.filter(val => val !== audioItem.id);
              }
            });
            audio.addEventListener('loadedmetadata', function () {
              if (audioItem.id) {
                audioElements.set(audioItem.id, {
                  audio, duration: this.duration,
                });
                loadedItems.value.push(audioItem.id);
              }
            });
            console.log(link);
            audio.src = link;
          }
        }
      });
    };

    const audioData = (id: string) => {
      return audioElements.get(id);
    };

    const hoverItem = (val: GalleryInterface) => {
      const item = items.value.find(o => o.id === val.id);
      if (item || val.id === '_default_') {
        const link = val.id === '_default_'
          ? `${location.origin}/gallery/_default_${props.type}`
          : location.origin + '/gallery/' + item?.id;
        return {
          ...item,
          name: item?.name || `default ${props.type}`,
          type: item?.type || defaultTypes[props.type],
          link,
        };
      }
      return null;
    };

    const activeItem = computed(() => {
      if (active.value.length > 0) {
        const item = items.value.find(o => o.id === active.value[0]);
        if (item || active.value[0] === '_default_') {
          const link = active.value[0] === '_default_'
            ? `${location.origin}/gallery/_default_${props.type}`
            : location.origin + '/gallery/' + item?.id;
          return {
            ...item,
            name:     item?.name || `default ${props.type}`,
            type:     item?.type || defaultTypes[props.type],
            width:    imageWidth.value,
            height:   imageHeight.value,
            duration: duration.value,
            link,
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
      if (getChildrenOf().children) {
        return [
          {
            id:   '_default_',
            name: `default ${props.type}`,
            file: props.type === 'image' ? 'image/png' : 'audio/mp3',
          },
          ...getChildrenOf().children,
        ];
      } else {
        return [];
      }
    });

    const filesChange = (filesUpload: HTMLInputElement['files']) => {
      if (!filesUpload) {
        return;
      }
      uploading.value = true;
      isUploadingNum.value = filesUpload.length;
      uploadedFiles.value = 0;

      for (let i = 0, l = filesUpload.length; i < l; i++) {
        const reader = new FileReader();
        reader.onload = async () => {
          const id = shortid();
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
                folder:  '/alerts',
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

    const playItem = (item: GalleryInterface) => {
      if (item.id && audioElements.has(item.id)) {
        const snd = audioElements.get(item.id)?.audio;
        if (snd) {
          snd.volume = props.volume / 100;
          // check if playing then toggle and save to playingId variable
          if (snd.paused) {
            snd.play();
          } else {
            snd.pause();
          }
        }
      }
    };

    return {
      playItem,
      loading,
      uploading,
      files,
      activeItem,
      active,
      opened,
      duration,
      mediaType,
      translate,
      model,
      showInfo,
      itemsTree,
      _loop,
      src,
      hoverItem,
      filesChange,
      audioData,
      loadedItems,
      playingItems,
    };
  },
});
</script>
