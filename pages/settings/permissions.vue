<template>
  <v-overlay v-if="loading" absolute>
    <v-row>
      <v-col class="text-center">
        <v-progress-circular indeterminate size="48" />
      </v-col>
    </v-row>
  </v-overlay>
  <v-container v-else fluid>
    <v-row dense class="pt-2">
      <v-col cols="auto">
        <v-card>
          <v-toolbar dense color="blue-grey darken-4">
            <v-toolbar-title class="text-button">
              {{ translate('core.permissions.permissionsGroups') }}
            </v-toolbar-title>
            <v-spacer />
            <v-btn icon :loading="state.saving" @click="addNewPermissionGroup">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </v-toolbar>
          <v-card-text class="pa-0">
            <v-tabs ref="tabsRef" v-model="tab" vertical>
              <v-tab
                v-for="permission of permissions"
                :id="permission.id"
                :key="permission.id"
                :disabled="state.saving"
                style="text-align: left; justify-content: normal; max-width: none;"
                nuxt
                :to="'/settings/permissions/' + permission.id"
              >
                <template v-if="permission.id !== defaultPermissions.VIEWERS && permission.id !== defaultPermissions.CASTERS">
                  <template v-if="$vuetify.breakpoint.mobile">
                    <v-icon v-if="permission.order > 1" @click.stop="swapOrder(permission.order, permission.order - 1)">
                      mdi-chevron-up
                    </v-icon>
                    <v-icon v-if="permission.order !== permissions.length - 2" @click.stop="swapOrder(permission.order, permission.order + 1)">
                      mdi-chevron-down
                    </v-icon>
                  </template>
                  <v-icon v-else :disabled="state.dragging || state.saving" @mousedown.prevent="handleDragStart($event, permission.id)">
                    mdi-drag
                  </v-icon>
                </template>
                <v-icon left small>
                  {{ permission.isWaterfallAllowed ? 'mdi-greater-than-or-equal' : 'mdi-equal' }}
                </v-icon>
                <span :class="{ 'white--text': permission.isCorePermission }">{{ permission.name }}</span>
                <template v-if="permission.automation">
                  <v-spacer />
                  <v-icon left small>
                    mdi-cog
                  </v-icon>
                  <small class="text-caption">{{ translate('core.permissions.' + permission.automation) }}</small>
                </template>
              </v-tab>
            </v-tabs>
          </v-card-text>
        </v-card>
        <v-alert color="error" text>
          {{ translate('core.permissions.higherPermissionHaveAccessToLowerPermissions') }}
        </v-alert>
      </v-col>
      <v-col>
        <NuxtChild />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import type { PermissionsInterface } from '@entity/permissions';
import { defaultPermissions } from '@sogebot/ui-helpers/permissions/defaultPermissions';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { cloneDeep, sortBy } from 'lodash';
import shortid from 'shortid';
import { v4 } from 'uuid';

import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';

const originalWidths: string[] = [];
let originalHeight = 0;
let afterElement: Element | null = null;

function handleDragStart (e: DragEvent) {
  EventBus.$emit(`carousel::dragstart`);
  // we want to select first tr
  let element: HTMLElement;
  for (const el of (e as any).path as unknown as HTMLElement[]) {
    if (el.tagName === 'A') {
      element = el;

      // set widths
      for (const cell of element.children) {
        originalWidths.push(`${parseInt(window.getComputedStyle(cell).width)}px`);
      }
      originalHeight = Number(window.getComputedStyle(element).height.replace('px', '')) + 10;
      afterElement = element.nextElementSibling;
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

    // we need to move element under app
    document.getElementById('app')?.appendChild(element);

    // we need to dynamically move elements up if reached bottom
    element.style.opacity = '0.8';
    element.style.zIndex = String(9999);
    element.style.top = (ev.clientY + originalHeight - 70) + 'px';
    element.style.left = (ev.clientX + 5) + 'px';
    element.style.position = 'fixed';
    originalWidths.length = 0;
  }

  function handleDragEnd (ev: MouseEvent) {
    let parent: null | Element = null;
    let elFromPoint = document.elementFromPoint(ev.clientX, ev.clientY);

    if (elFromPoint) {
      if (elFromPoint.tagName !== 'A') {
        while (!parent) {
          const parentElement: HTMLElement | null = elFromPoint?.parentElement;
          if (parentElement) {
            if (parentElement.tagName === 'A') {
              parent = parentElement;
            } else {
              elFromPoint = parentElement;
            }
          } else {
            break;
          }
        }
      } else {
        parent = elFromPoint;
      }
    }
    if (parent && parent.id !== defaultPermissions.CASTERS) {
      try {
        parent.parentNode?.insertBefore(element, parent);
        EventBus.$emit(`permissions::dragdrop`);
      } catch (err) {
        // we need to return it back to same place
        error(err as Error);
      }
    } else {
      afterElement?.parentNode?.insertBefore(element, afterElement);
      // we need to return it into same place
    }

    element.style.position = 'inherit';
    element.style.opacity = '1';
    element.style.top = 'inherit';
    element.style.left = 'inherit';
    document.onmousemove = null;
    document.onmouseup = null;
    EventBus.$emit(`permissions::dragstop`);
  }
  document.onmousemove = elementDrag;
}

export default defineComponent({
  setup () {
    const loading = ref(true);
    const permissions = ref([] as PermissionsInterface[]);

    const refetch = () => {
      getSocket('/core/permissions').emit('generic::getAll', (err, res) => {
        if (err) {
          return console.error(err);
        }
        permissions.value = res;

        if (!route.params.id) {
          router.replace('/settings/permissions/' + permissions.value[0].id);
        }
        loading.value = false;
      });
    };

    const route = useRoute();
    const router = useRouter();
    const tab = ref(0);
    const tabsRef = ref(null as any);

    const state = ref({ dragging: false, saving: false } as {
      dragging: boolean;
      saving: boolean;
    });

    watch(() => route.params.id, (val?: string) => {
      if (!val && !loading.value) {
        if (!route.params.id) {
          router.replace('/settings/permissions/' + permissions.value[0].id);
        }
      }
    });

    onMounted(() => {
      refetch();
      EventBus
        .$off('settings::permissions::refresh')
        .$on('settings::permissions::refresh', refetch);

      EventBus.$off(`permissions::dragdrop`).$off(`permissions::dragstart`);
      EventBus.$on(`permissions::dragstart`, () => {
        state.value.dragging = true;
      });
      EventBus.$on(`permissions::dragstop`, () => {
        state.value.dragging = false;
      });
      EventBus.$on(`permissions::dragdrop`, async () => {
        // we need to go through 'A', get list of Ids and resave
        const potentiallyAnchors = tabsRef.value.$el.children[0].children[1].children[0].children as HTMLCollection;
        let i = 0;
        await Promise.all(
          [...potentiallyAnchors].map((el) => {
            return new Promise((resolve) => {
              if (el.tagName === 'A') {
                const permission = permissions.value.find(o => o.id === el.id);
                if (permission) {
                  permission.order = i++;
                }
              }
              resolve(true);
            });
          }),
        );
        reorder();
      });
    });

    const reorder = () => {
      // update orders
      const viewers = cloneDeep(permissions.value.find(o => o.id === defaultPermissions.VIEWERS));
      permissions.value = sortBy(permissions.value.filter(o => o.id !== defaultPermissions.VIEWERS), 'order', 'asc');

      if (viewers) {
        viewers.order = permissions.value.length;
        permissions.value.push(viewers);
      }

      getSocket('/core/permissions').emit('permission::save', permissions.value, () => {})
    };

    const addNewPermissionGroup = () => {
      const id = v4();
      const data: PermissionsInterface = {
        id,
        name:               shortid.generate(),
        isCorePermission:   false,
        isWaterfallAllowed: true,
        automation:         'none',
        order:              permissions.value.length - 1,
        userIds:            [],
        excludeUserIds:     [],
        filters:            [],
      };
      permissions.value.push(data);
      reorder(); // include save
    };

    const swapOrder = (order1: number, order2: number) => {
      const item1 = permissions.value.find(o => o.order === order1);
      const item2 = permissions.value.find(o => o.order === order2);
      if (item1 && item2) {
        item1.order = order2;
        item2.order = order1;
      }
      reorder();
    };

    return {
      // refs
      loading,
      permissions,
      tab,
      state,
      tabsRef,

      // functions
      addNewPermissionGroup,
      handleDragStart,
      swapOrder,

      // others
      translate,
      defaultPermissions,
    };
  },
});
</script>
