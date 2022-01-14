<template>
  <div>
    <input
      ref="uploadImage"
      class="d-none"
      type="file"
      accept="image/*, video/webm"
      @change="filesChange($event.target.files)"
    >
    <input
      ref="uploadAudio"
      class="d-none"
      type="file"
      accept="audio/*"
      @change="filesChange($event.target.files)"
    >
    <v-row v-if="(type === 'image' && !model) || mediaType === 'image'" ref="rowRef">
      <v-col>
        <v-card>
          <v-card-text v-if="model">
            <v-img class="ma-auto text-center" :src="src" :height="sizeOfMedia[1]" :width="sizeOfMedia[0]" />
          </v-card-text>
          <v-card-actions>
            <div class="ma-auto text-center">
              <v-btn v-if="model" color="error" @click="model = null">
                <v-icon left>
                  mdi-delete-forever
                </v-icon> {{ translate('delete') }}
              </v-btn>
              <v-btn
                :loading="loading"
                @click="$refs.uploadImage.click()"
              >
                <v-icon left>
                  mdi-upload
                </v-icon> {{ translate('dialog.buttons.upload.idle') }}
              </v-btn>
            </div>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-row v-else-if="mediaType === 'video'" ref="rowRef">
      <v-col>
        <v-card>
          <v-card-text>
            <div class="ma-auto text-center">
              <video
                ref="video"
                :loop="_loop"
                :key="createdAt"
                :style="{
                  width: sizeOfMedia[0] + 'px',
                  height: sizeOfMedia[1] + 'px',
                }"
              >
                <source
                  :src="src"
                  type="video/webm"
                >
                Your browser does not support the video tag.
              </video>

              <v-switch
                v-model="_loop"
                hide-details="auto"
                :label="translate('registry.alerts.loop.name')"
              />
            </div>
          </v-card-text>
          <v-card-actions>
            <div class="ma-auto text-center">
              <v-btn color="error" @click="removeMedia()">
                <v-icon left>
                  mdi-delete-forever
                </v-icon> {{ translate('delete') }}
              </v-btn>
              <v-btn @click="isPlaying ? stop() : play()">
                <v-icon left>
                  {{ isPlaying ? mdiStop : mdiPlay }}
                </v-icon>
                {{ translate(isPlaying ? 'dialog.buttons.stop' : 'dialog.buttons.play') }} ({{ duration }}s)
              </v-btn>
              <v-btn
                :loading="loading"
                @click="$refs.uploadImage.click()"
              >
                <v-icon left>
                  mdi-upload
                </v-icon> {{ translate('dialog.buttons.upload.idle') }}
              </v-btn>
            </div>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-row v-else-if="type === 'audio'">
      <v-col>
        <v-card>
          <v-card-text v-if="model">
            <av-line
              v-if="audioAvailable"
              ref="audio"
              :audio-controls="false"
              :audio-src="`/api/v2/registry/alerts/media/${value}`"
              canv-class="w-100"
              :canv-width="1000"
            />
          </v-card-text>
          <v-card-actions>
            <div class="ma-auto text-center">
              <v-btn v-if="model" color="error" @click="model = null">
                <v-icon left>
                  mdi-delete-forever
                </v-icon> {{ translate('delete') }}
              </v-btn>
              <v-btn v-if="audioAvailable" @click="isPlaying ? stop() : play()">
                <v-icon left>
                  {{ isPlaying ? mdiStop : mdiPlay }}
                </v-icon>
                {{ translate(isPlaying ? 'dialog.buttons.stop' : 'dialog.buttons.play') }} ({{ duration }}s)
              </v-btn>
              <v-btn
                :loading="loading"
                @click="$refs.uploadAudio.click()"
              >
                <v-icon left>
                  mdi-upload
                </v-icon> {{ translate('dialog.buttons.upload.idle') }}
              </v-btn>
            </div>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import {
  defineComponent, onMounted, onUnmounted, ref, watch,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';
import { useMutation } from '@vue/apollo-composable';
import Vue from 'vue';
import AudioVisual from 'vue-audio-visual';

import { error } from '../../../../functions/error';
import { getBase64FromUrl } from '../../../../functions/getBase64FromURL';

import UPLOAD from '~/queries/alert/upload.gql';

Vue.use(AudioVisual);

interface Props {
  value: string; default?: string; type: 'image' | 'audio'; volume: number; loop: boolean;
}

export default defineComponent({
  props: {
    value:   String,
    default: String,
    type:    String,
    volume:  Number,
    loop:    Boolean,
  },
  setup (props: Props, ctx) {
    const { mutate: uploadMutation, onError: onErrorUpload, loading } = useMutation(UPLOAD);
    onErrorUpload(error);

    let interval = 0;
    const duration = ref(0);
    const createdAt = ref(Date.now());
    const isPlaying = ref(false);
    const mediaType = ref(props.type as 'image' | 'video' | 'audio');
    const sizeOfMedia = ref([0, 0]);
    const rowRef = ref(null as null | HTMLElement);
    const model = ref(props.value as string | null);
    const audioAvailable = ref(false);

    const src = ref(null as null | string);

    const _loop = ref(props.loop);
    watch(_loop, (val) => {
      ctx.emit('update:loop', val);
    });

    watch(model, (val) => {
      createdAt.value = Date.now();
      ctx.emit('input', val);
    });

    watch(sizeOfMedia, (val) => {
      const maxHeight = 200;
      const maxWidth = rowRef.value?.clientWidth ?? 200;
      let width = val[0];
      let height = val[1];

      if (height > maxHeight) {
        const ratio = maxHeight / height;
        height = maxHeight;
        width = width * ratio;
      }

      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = height * ratio;
      }

      if (sizeOfMedia.value[0] !== width || sizeOfMedia.value[1] !== height) {
        console.log('Size of adjusted image', [width, height]);
        sizeOfMedia.value = [width, height];
      }
    });

    onMounted(() => {
      refresh();
      startInterval();
    });
    onUnmounted(() => {
      clearInterval(interval);
    });

    const refresh = () => {
      if (props.type === 'image') {
        fetch(`/api/v2/registry/alerts/media/${model.value}`)
          .then(async (response) => {
            if (!response.ok) {
              src.value = null;
              throw new Error('Network response was not ok');
            }
            const myBlob = await response.blob();
            console.log(`${myBlob.type.startsWith('video') ? 'Video' : 'Image'} ${model.value} was found on server.`);
            mediaType.value = myBlob.type.startsWith('video') ? 'video' : 'image';
            src.value = URL.createObjectURL(myBlob);

            if (mediaType.value === 'video') {
              const vid = document.createElement('video');
              vid.addEventListener('loadedmetadata', (ev) => {
                const el = ev.target as HTMLVideoElement;
                console.log('Size of video', [el.videoWidth, el.videoHeight]);
                sizeOfMedia.value = [el.videoWidth, el.videoHeight];
              });
              vid.src = `/api/v2/registry/alerts/media/${model.value}`;
            } else {
              const img = new Image();
              img.addEventListener('load', (ev) => {
                const el = ev.target as HTMLImageElement;
                console.log('Size of image', [el.naturalWidth, el.naturalHeight]);
                sizeOfMedia.value = [el.naturalWidth, el.naturalHeight];
              });
              img.src = `/api/v2/registry/alerts/media/${model.value}`;
            }
          })
          .catch((err) => {
            console.error(err);
            console.error(`Image/Video ${props.value} was not found on server.`);
          });
      } else {
        audioAvailable.value = false;
        fetch(`/api/v2/registry/alerts/media/${model.value}`)
          .then((response) => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            } else {
              console.log(`Audio ${model.value} was found on server.`);
              audioAvailable.value = true;
            }
          })
          .catch((err) => {
            console.error(err);
            console.error(`Audio ${props.value} was not found on server.`);
          });
      }
    };

    // template refs
    const audio = ref(null as null | any);
    const video = ref(null as null | HTMLVideoElement);

    const play = () => {
      setVolume();
      if (audio.value) {
        audio.value.audio.play();
      }
      if (video.value) {
        video.value.play();
      }
    };

    const stop = () => {
      if (audio.value) {
        audio.value?.audio.pause();
        audio.value.currentTime = 0;
      }
      if (video.value) {
        video.value.pause();
        video.value.currentTime = 0;
      }
    };

    const isPlayingSetter = () => {
      if (audio.value) {
        isPlaying.value = !audio.value.audio.paused;
      } else if (video.value) {
        isPlaying.value = !video.value.paused;
      }
    };

    const setDuration = () => {
      if (audio.value) {
        duration.value = audio.value.audio.duration;
        if (isNaN(duration.value)) {
          duration.value = 0;
        } else {
          duration.value = Math.floor(duration.value * 10) / 10;
        }
      }
      if (video.value) {
        duration.value = video.value.duration;
        if (isNaN(duration.value)) {
          duration.value = 0;
        } else {
          duration.value = Math.floor(duration.value * 10) / 10;
        }
      }
    };

    const startInterval = () => {
      interval = window.setInterval(() => {
        if (!model.value) {
          duration.value = 0;
          return;
        }
        setVolume();
        isPlayingSetter();
        setDuration();
      }, 100);
    };

    const setVolume = () => {
      if (!model.value) {
        return;
      }

      if (props.type === 'audio' || mediaType.value === 'video') {
        if (props.type === 'audio') {
          if (typeof audio.value === 'undefined') {
            console.debug(`Retrying setVolume ${model.value}`);
            setTimeout(() => setVolume(), 100);
            return;
          }
          if (audio.value) {
            audio.value.audio.volume = props.volume / 100;
          }
        } else {
          if (typeof video.value === 'undefined') {
            console.debug(`Retrying setVolume ${model.value}`);
            setTimeout(() => setVolume(), 100);
            return;
          }
          if (video.value) {
            video.value.volume = props.volume / 100;
          }
        }
      }
    };
    const removeMedia = () => {
      model.value = null;
      audioAvailable.value = false;
    };

    const filesChange = async (filesUpload: HTMLInputElement['files']) => {
      if (!filesUpload) {
        return;
      }
      for (let i = 0, l = filesUpload.length; i < l; i++) {
        console.debug(`upload::${filesUpload[i].name}`);
        const data = await getBase64FromUrl(URL.createObjectURL(filesUpload[i]));
        const res = await uploadMutation({
          data,
        });
        model.value = res?.data.alertMediaUpload;
      }
      refresh();
    };

    return {
      duration,
      audioAvailable,

      filesChange,

      createdAt,
      mediaType,
      audio,
      video,
      removeMedia,
      play,
      translate,
      isPlaying,
      stop,
      sizeOfMedia,
      rowRef,
      model,
      loading,
      _loop,
      src,
    };
  },
});
</script>
