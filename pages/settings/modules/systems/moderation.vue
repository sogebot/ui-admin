<template>
  <loading v-if="!settings" />
  <v-form v-else v-model="valid" lazy-validation>
    <v-tabs v-model="tab">
      <v-tab>{{translate('categories.warnings')}}</v-tab>
      <v-tab>{{translate('categories.lists')}}</v-tab>
      <v-tab>{{translate('categories.caps_filter')}}</v-tab>
      <v-tab>{{translate('categories.color_filter')}}</v-tab>
      <v-tab>{{translate('categories.emotes_filter')}}</v-tab>
      <v-tab>{{translate('categories.links_filter')}}</v-tab>
      <v-tab>{{translate('categories.longMessage_filter')}}</v-tab>
      <v-tab>{{translate('categories.spam_filter')}}</v-tab>
      <v-tab>{{translate('categories.symbols_filter')}}</v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab">
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <revert-text-field v-model="settings.warnings.cWarningsAllowedCount" type="number" min="0"
              :label="translate('systems.moderation.settings.cWarningsAllowedCount')"
              :rules="[required, minValue(0)]" />
            <v-switch dense class="mt-0" :label="translate('systems.moderation.settings.cWarningsAnnounceTimeouts')"
              v-model="settings.warnings.cWarningsAnnounceTimeouts[0]" />
            <v-switch dense class="mt-0" :label="translate('systems.moderation.settings.cWarningsShouldClearChat')"
              v-model="settings.warnings.cWarningsShouldClearChat[0]" />
          </v-card-text>
        </v-card>
      </v-tab-item>
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <v-textarea auto-grow outlined persistent-hint :label="translate('systems.moderation.settings.autobanMessages')"
              :value="settings.lists.autobanMessages[0]"
              @input="settings.lists.autobanMessages[0] = $event.split('\n').filter(String); $store.commit('settings/pending', true);"
              :hint="translate('one-record-per-line')" />
            <v-textarea auto-grow outlined type="password" persistent-hint @focus="maskBlacklist = false;"
              @blur="maskBlacklist = true;" :label="translate('systems.moderation.settings.cListsBlacklist')"
              :value="settings.lists.cListsBlacklist[0].filter(String).join('\n').replace(maskBlacklist ? /./g : '', maskBlacklist ? '*' : '')"
              @input="settings.lists.cListsBlacklist[0] = $event.split('\n').filter(String); $store.commit('settings/pending', true);"
              :hint="translate('one-record-per-line')" />
            <v-textarea auto-grow outlined persistent-hint
              :label="translate('systems.moderation.settings.cListsWhitelist.title')"
              :value="settings.lists.cListsWhitelist[0].filter(String).join('\n')"
              @input="settings.lists.cListsWhitelist[0] = $event.split('\n').filter(String); $store.commit('settings/pending', true);"
              :hint="translate('one-record-per-line') + translate('systems.moderation.settings.cListsWhitelist.help')" />
            <permission-tabs v-slot:default="{permissions}" :ignored="getIgnoredPermissions(settings, 'lists')">
              <v-tab-item v-for="permission of permissions" :key="permission.id" eager>
                <v-row>
                  <v-col>
                    <v-switch class="mb-1" hide-details
                      :label="translate('systems.moderation.settings.cListsEnabled')"
                      :input-value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.lists.cListsEnabled[0])"
                      @change="settings.__permission_based__.lists.cListsEnabled[0][permission.id] = $event"
                      :disabled="settings.__permission_based__.lists.cListsEnabled[0][permission.id] === null" />
                  </v-col>
                  <v-col align-self="center" cols="auto"
                    v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
                    <v-btn icon
                      @click="settings.__permission_based__.lists.cListsEnabled[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.lists.cListsEnabled[0])">
                      <v-icon>
                        {{ settings.__permission_based__.lists.cListsEnabled[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}
                      </v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
                <v-row class="mt-0">
                  <v-col>
                    <v-text-field type="number" class="mb-1" hide-details min="0"
                      :label="translate('systems.moderation.settings.cListsTimeout')"
                      :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.lists.cListsTimeout[0])"
                      @input="settings.__permission_based__.lists.cListsTimeout[0][permission.id] = Number($event)"
                      :rules="[required, minValue(1)]"
                      :disabled="settings.__permission_based__.lists.cListsTimeout[0][permission.id] === null" />
                  </v-col>
                  <v-col align-self="center" cols="auto"
                    v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
                    <v-btn icon
                      @click="settings.__permission_based__.lists.cListsTimeout[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.lists.cListsTimeout[0])">
                      <v-icon>
                        {{ settings.__permission_based__.lists.cListsTimeout[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}
                      </v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
              </v-tab-item>
            </permission-tabs>
          </v-card-text>
        </v-card>
      </v-tab-item>
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <permission-tabs v-slot:default="{permissions}" :ignored="getIgnoredPermissions(settings, 'caps_filter')">
              <v-tab-item v-for="permission of permissions" :key="permission.id" eager>
                <v-row>
                  <v-col>
                    <v-switch class="mb-1" hide-details
                      :label="translate('systems.moderation.settings.cCapsEnabled')"
                      :input-value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.caps_filter.cCapsEnabled[0])"
                      @change="settings.__permission_based__.caps_filter.cCapsEnabled[0][permission.id] = $event"
                      :disabled="settings.__permission_based__.caps_filter.cCapsEnabled[0][permission.id] === null" />
                  </v-col>
                  <v-col align-self="center" cols="auto"
                    v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
                    <v-btn icon
                      @click="settings.__permission_based__.caps_filter.cCapsEnabled[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.caps_filter.cCapsEnabled[0])">
                      <v-icon>
                        {{ settings.__permission_based__.caps_filter.cCapsEnabled[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}
                      </v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
                <v-row class="mt-0">
                  <v-col>
                    <v-text-field type="number" class="mb-1" hide-details min="0"
                      :label="translate('systems.moderation.settings.cCapsMaxCapsPercent')"
                      :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.caps_filter.cCapsMaxCapsPercent[0])"
                      @input="settings.__permission_based__.caps_filter.cCapsMaxCapsPercent[0][permission.id] = Number($event)"
                      :rules="[required, minValue(1), maxValue(100)]"
                      :disabled="settings.__permission_based__.caps_filter.cCapsMaxCapsPercent[0][permission.id] === null" />
                  </v-col>
                  <v-col align-self="center" cols="auto"
                    v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
                    <v-btn icon
                      @click="settings.__permission_based__.caps_filter.cCapsMaxCapsPercent[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.caps_filter.cCapsMaxCapsPercent[0])">
                      <v-icon>
                        {{ settings.__permission_based__.caps_filter.cCapsMaxCapsPercent[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}
                      </v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
                <v-row class="mt-0">
                  <v-col>
                    <v-text-field type="number" class="mb-1" hide-details min="0"
                      :label="translate('systems.moderation.settings.cCapsTriggerLength')"
                      :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.caps_filter.cCapsTriggerLength[0])"
                      @input="settings.__permission_based__.caps_filter.cCapsTriggerLength[0][permission.id] = Number($event)"
                      :rules="[required, minValue(1)]"
                      :disabled="settings.__permission_based__.caps_filter.cCapsTriggerLength[0][permission.id] === null" />
                  </v-col>
                  <v-col align-self="center" cols="auto"
                    v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
                    <v-btn icon
                      @click="settings.__permission_based__.caps_filter.cCapsTriggerLength[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.caps_filter.cCapsTriggerLength[0])">
                      <v-icon>
                        {{ settings.__permission_based__.caps_filter.cCapsTriggerLength[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}
                      </v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
                <v-row class="mt-0">
                  <v-col>
                    <v-text-field type="number" class="mb-1" hide-details min="0"
                      :label="translate('systems.moderation.settings.cCapsTimeout')"
                      :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.caps_filter.cCapsTimeout[0])"
                      @input="settings.__permission_based__.caps_filter.cCapsTimeout[0][permission.id] = Number($event)"
                      :rules="[required, minValue(1)]"
                      :disabled="settings.__permission_based__.caps_filter.cCapsTimeout[0][permission.id] === null" />
                  </v-col>
                  <v-col align-self="center" cols="auto"
                    v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
                    <v-btn icon
                      @click="settings.__permission_based__.caps_filter.cCapsTimeout[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.caps_filter.cCapsTimeout[0])">
                      <v-icon>
                        {{ settings.__permission_based__.caps_filter.cCapsTimeout[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}
                      </v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
              </v-tab-item>
            </permission-tabs>
          </v-card-text>
        </v-card>
      </v-tab-item>
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <permission-tabs v-slot:default="{permissions}" :ignored="getIgnoredPermissions(settings, 'color_filter')">
              <v-tab-item v-for="permission of permissions" :key="permission.id" eager>
                <v-row>
                  <v-col>
                    <v-switch class="mb-1" hide-details
                      :label="translate('systems.moderation.settings.cColorEnabled')"
                      :input-value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.color_filter.cColorEnabled[0])"
                      @change="settings.__permission_based__.color_filter.cColorEnabled[0][permission.id] = $event"
                      :disabled="settings.__permission_based__.color_filter.cColorEnabled[0][permission.id] === null" />
                  </v-col>
                  <v-col align-self="center" cols="auto"
                    v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
                    <v-btn icon
                      @click="settings.__permission_based__.color_filter.cColorEnabled[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.color_filter.cColorEnabled[0])">
                      <v-icon>
                        {{ settings.__permission_based__.color_filter.cColorEnabled[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}
                      </v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
                <v-row class="mt-0">
                  <v-col>
                    <v-text-field type="number" class="mb-1" hide-details min="0"
                      :label="translate('systems.moderation.settings.cColorTimeout')"
                      :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.color_filter.cColorTimeout[0])"
                      @input="settings.__permission_based__.color_filter.cColorTimeout[0][permission.id] = Number($event)"
                      :rules="[required, minValue(1)]"
                      :disabled="settings.__permission_based__.color_filter.cColorTimeout[0][permission.id] === null" />
                  </v-col>
                  <v-col align-self="center" cols="auto"
                    v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
                    <v-btn icon
                      @click="settings.__permission_based__.color_filter.cColorTimeout[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.color_filter.cColorTimeout[0])">
                      <v-icon>
                        {{ settings.__permission_based__.color_filter.cColorTimeout[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}
                      </v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
              </v-tab-item>
            </permission-tabs>
          </v-card-text>
        </v-card>
      </v-tab-item>
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <permission-tabs v-slot:default="{permissions}" :ignored="getIgnoredPermissions(settings, 'emotes_filter')">
              <v-tab-item v-for="permission of permissions" :key="permission.id" eager>
                <v-row>
                  <v-col>
                    <v-layout row wrap align-baseline class="ma-0">
                    <v-switch class="mb-1" hide-details
                      :label="translate('systems.moderation.settings.cEmotesEnabled')"
                      :input-value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.emotes_filter.cEmotesEnabled[0])"
                      @change="settings.__permission_based__.emotes_filter.cEmotesEnabled[0][permission.id] = $event"
                      :disabled="settings.__permission_based__.emotes_filter.cEmotesEnabled[0][permission.id] === null" />
                      <v-btn v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'" icon
                        @click="settings.__permission_based__.emotes_filter.cEmotesEnabled[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.emotes_filter.cEmotesEnabled[0])">
                        <v-icon>
                          {{ settings.__permission_based__.emotes_filter.cEmotesEnabled[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}
                        </v-icon>
                      </v-btn>
                    </v-layout>
                  </v-col>
                  <v-col>
                    <v-layout row wrap align-baseline class="ma-0">
                      <v-switch class="mb-1" hide-details
                        :label="translate('systems.moderation.settings.cEmotesEmojisAreEmotes')"
                        :input-value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.emotes_filter.cEmotesEmojisAreEmotes[0])"
                        @change="settings.__permission_based__.emotes_filter.cEmotesEmojisAreEmotes[0][permission.id] = $event"
                        :disabled="settings.__permission_based__.emotes_filter.cEmotesEmojisAreEmotes[0][permission.id] === null" />
                      <v-btn v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'" icon
                        @click="settings.__permission_based__.emotes_filter.cEmotesEmojisAreEmotes[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.emotes_filter.cEmotesEmojisAreEmotes[0])">
                        <v-icon>
                          {{ settings.__permission_based__.emotes_filter.cEmotesEmojisAreEmotes[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}
                        </v-icon>
                      </v-btn>
                    </v-layout>
                  </v-col>
                </v-row>
                <v-row class="mt-0">
                  <v-col>
                    <v-text-field type="number" class="mb-1" hide-details min="0"
                      :label="translate('systems.moderation.settings.cEmotesMaxCount')"
                      :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.emotes_filter.cEmotesMaxCount[0])"
                      @input="settings.__permission_based__.emotes_filter.cEmotesMaxCount[0][permission.id] = Number($event)"
                      :rules="[required, minValue(1)]"
                      :disabled="settings.__permission_based__.emotes_filter.cEmotesMaxCount[0][permission.id] === null" />
                  </v-col>
                  <v-col align-self="center" cols="auto"
                    v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
                    <v-btn icon
                      @click="settings.__permission_based__.emotes_filter.cEmotesMaxCount[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.emotes_filter.cEmotesMaxCount[0])">
                      <v-icon>
                        {{ settings.__permission_based__.emotes_filter.cEmotesMaxCount[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}
                      </v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
                <v-row class="mt-0">
                  <v-col>
                    <v-text-field type="number" class="mb-1" hide-details min="0"
                      :label="translate('systems.moderation.settings.cEmotesTimeout')"
                      :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.emotes_filter.cEmotesTimeout[0])"
                      @input="settings.__permission_based__.emotes_filter.cEmotesTimeout[0][permission.id] = Number($event)"
                      :rules="[required, minValue(1)]"
                      :disabled="settings.__permission_based__.emotes_filter.cEmotesTimeout[0][permission.id] === null" />
                  </v-col>
                  <v-col align-self="center" cols="auto"
                    v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
                    <v-btn icon
                      @click="settings.__permission_based__.emotes_filter.cEmotesTimeout[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.emotes_filter.cEmotesTimeout[0])">
                      <v-icon>
                        {{ settings.__permission_based__.emotes_filter.cEmotesTimeout[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}
                      </v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
              </v-tab-item>
            </permission-tabs>
          </v-card-text>
        </v-card>
      </v-tab-item>
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <permission-tabs v-slot:default="{permissions}" :ignored="getIgnoredPermissions(settings, 'links_filter')">
              <v-tab-item v-for="permission of permissions" :key="permission.id" eager>
                <v-row>
                  <v-col>
                    <v-layout row wrap align-baseline class="ma-0">
                      <v-switch class="mb-1" hide-details
                        :label="translate('systems.moderation.settings.cLinksEnabled')"
                        :input-value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.links_filter.cLinksEnabled[0])"
                        @change="settings.__permission_based__.links_filter.cLinksEnabled[0][permission.id] = $event"
                        :disabled="settings.__permission_based__.links_filter.cLinksEnabled[0][permission.id] === null" />
                      <v-btn v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'" icon
                        @click="settings.__permission_based__.links_filter.cLinksEnabled[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.links_filter.cLinksEnabled[0])">
                        <v-icon>
                          {{ settings.__permission_based__.links_filter.cLinksEnabled[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}
                        </v-icon>
                      </v-btn>
                    </v-layout>
                  </v-col>
                  <v-col>
                    <v-layout row wrap align-baseline class="ma-0">
                      <v-switch class="mb-1" hide-details
                        :label="translate('systems.moderation.settings.cLinksIncludeClips')"
                        :input-value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.links_filter.cLinksIncludeClips[0])"
                        @change="settings.__permission_based__.links_filter.cLinksIncludeClips[0][permission.id] = $event"
                        :disabled="settings.__permission_based__.links_filter.cLinksIncludeClips[0][permission.id] === null" />
                      <v-btn v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'" icon
                        @click="settings.__permission_based__.links_filter.cLinksIncludeClips[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.links_filter.cLinksIncludeClips[0])">
                        <v-icon>
                          {{ settings.__permission_based__.links_filter.cLinksIncludeClips[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}
                        </v-icon>
                      </v-btn>
                    </v-layout>
                  </v-col>
                  <v-col>
                    <v-layout row wrap align-baseline class="ma-0">
                      <v-switch class="mb-1" hide-details
                        :label="translate('systems.moderation.settings.cLinksIncludeSpaces')"
                        :input-value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.links_filter.cLinksIncludeSpaces[0])"
                        @change="settings.__permission_based__.links_filter.cLinksIncludeSpaces[0][permission.id] = $event"
                        :disabled="settings.__permission_based__.links_filter.cLinksIncludeSpaces[0][permission.id] === null" />
                      <v-btn v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'" icon
                        @click="settings.__permission_based__.links_filter.cLinksIncludeSpaces[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.links_filter.cLinksIncludeSpaces[0])">
                        <v-icon>
                          {{ settings.__permission_based__.links_filter.cLinksIncludeSpaces[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}
                        </v-icon>
                      </v-btn>
                    </v-layout>
                  </v-col>
                </v-row>
                <v-row class="mt-0">
                  <v-col>
                    <v-text-field type="number" class="mb-1" hide-details min="0"
                      :label="translate('systems.moderation.settings.cLinksTimeout')"
                      :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.links_filter.cLinksTimeout[0])"
                      @input="settings.__permission_based__.links_filter.cLinksTimeout[0][permission.id] = Number($event)"
                      :rules="[required, minValue(1)]"
                      :disabled="settings.__permission_based__.links_filter.cLinksTimeout[0][permission.id] === null" />
                  </v-col>
                  <v-col align-self="center" cols="auto"
                    v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
                    <v-btn icon
                      @click="settings.__permission_based__.links_filter.cLinksTimeout[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.links_filter.cLinksTimeout[0])">
                      <v-icon>
                        {{ settings.__permission_based__.links_filter.cLinksTimeout[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}
                      </v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
              </v-tab-item>
            </permission-tabs>
          </v-card-text>
        </v-card>
      </v-tab-item>
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <permission-tabs v-slot:default="{permissions}"
              :ignored="getIgnoredPermissions(settings, 'longMessage_filter')">
              <v-tab-item v-for="permission of permissions" :key="permission.id" eager>
                <v-row>
                  <v-col>
                    <v-layout row wrap align-baseline class="ma-0">
                      <v-switch class="mb-1" hide-details
                        :label="translate('systems.moderation.settings.cLongMessageEnabled')"
                        :input-value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.longMessage_filter.cLongMessageEnabled[0])"
                        @change="settings.__permission_based__.longMessage_filter.cLongMessageEnabled[0][permission.id] = $event"
                        :disabled="settings.__permission_based__.longMessage_filter.cLongMessageEnabled[0][permission.id] === null" />
                      <v-btn v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'" icon
                        @click="settings.__permission_based__.longMessage_filter.cLongMessageEnabled[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.longMessage_filter.cLongMessageEnabled[0])">
                        <v-icon>
                          {{ settings.__permission_based__.longMessage_filter.cLongMessageEnabled[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}
                        </v-icon>
                      </v-btn>
                    </v-layout>
                  </v-col>
                </v-row>
                <v-row class="mt-0">
                  <v-col>
                    <v-text-field type="number" class="mb-1" hide-details min="0"
                      :label="translate('systems.moderation.settings.cLongMessageTimeout')"
                      :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.longMessage_filter.cLongMessageTimeout[0])"
                      @input="settings.__permission_based__.longMessage_filter.cLongMessageTimeout[0][permission.id] = Number($event)"
                      :rules="[required, minValue(1)]"
                      :disabled="settings.__permission_based__.longMessage_filter.cLongMessageTimeout[0][permission.id] === null" />
                  </v-col>
                  <v-col align-self="center" cols="auto"
                    v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
                    <v-btn icon
                      @click="settings.__permission_based__.longMessage_filter.cLongMessageTimeout[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.longMessage_filter.cLongMessageTimeout[0])">
                      <v-icon>
                        {{ settings.__permission_based__.longMessage_filter.cLongMessageTimeout[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}
                      </v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
              </v-tab-item>
            </permission-tabs>
          </v-card-text>
        </v-card>
      </v-tab-item>
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <permission-tabs v-slot:default="{permissions}" :ignored="getIgnoredPermissions(settings, 'spam_filter')">
              <v-tab-item v-for="permission of permissions" :key="permission.id" eager>
                <v-row>
                  <v-col>
                    <v-layout row wrap align-baseline class="ma-0">
                      <v-switch class="mb-1" hide-details
                        :label="translate('systems.moderation.settings.cSpamEnabled')"
                        :input-value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.spam_filter.cSpamEnabled[0])"
                        @change="settings.__permission_based__.spam_filter.cSpamEnabled[0][permission.id] = $event"
                        :disabled="settings.__permission_based__.spam_filter.cSpamEnabled[0][permission.id] === null" />
                      <v-btn v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'" icon
                        @click="settings.__permission_based__.spam_filter.cSpamEnabled[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.spam_filter.cSpamEnabled[0])">
                        <v-icon>
                          {{ settings.__permission_based__.spam_filter.cSpamEnabled[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}
                        </v-icon>
                      </v-btn>
                    </v-layout>
                  </v-col>
                </v-row>
                <v-row class="mt-0">
                  <v-col>
                    <v-text-field type="number" class="mb-1" hide-details min="0"
                      :label="translate('systems.moderation.settings.cSpamTriggerLength')"
                      :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.spam_filter.cSpamTriggerLength[0])"
                      @input="settings.__permission_based__.spam_filter.cSpamTriggerLength[0][permission.id] = Number($event)"
                      :rules="[required, minValue(1)]"
                      :disabled="settings.__permission_based__.spam_filter.cSpamTriggerLength[0][permission.id] === null" />
                  </v-col>
                  <v-col align-self="center" cols="auto"
                    v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
                    <v-btn icon
                      @click="settings.__permission_based__.spam_filter.cSpamTriggerLength[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.spam_filter.cSpamTriggerLength[0])">
                      <v-icon>
                        {{ settings.__permission_based__.spam_filter.cSpamTriggerLength[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}
                      </v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
                <v-row class="mt-0">
                  <v-col>
                    <v-text-field type="number" class="mb-1" hide-details min="0"
                      :label="translate('systems.moderation.settings.cSpamMaxLength')"
                      :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.spam_filter.cSpamMaxLength[0])"
                      @input="settings.__permission_based__.spam_filter.cSpamMaxLength[0][permission.id] = Number($event)"
                      :rules="[required, minValue(1)]"
                      :disabled="settings.__permission_based__.spam_filter.cSpamMaxLength[0][permission.id] === null" />
                  </v-col>
                  <v-col align-self="center" cols="auto"
                    v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
                    <v-btn icon
                      @click="settings.__permission_based__.spam_filter.cSpamMaxLength[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.spam_filter.cSpamMaxLength[0])">
                      <v-icon>
                        {{ settings.__permission_based__.spam_filter.cSpamMaxLength[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}
                      </v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
                <v-row class="mt-0">
                  <v-col>
                    <v-text-field type="number" class="mb-1" hide-details min="0"
                      :label="translate('systems.moderation.settings.cSpamTimeout')"
                      :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.spam_filter.cSpamTimeout[0])"
                      @input="settings.__permission_based__.spam_filter.cSpamTimeout[0][permission.id] = Number($event)"
                      :rules="[required, minValue(1)]"
                      :disabled="settings.__permission_based__.spam_filter.cSpamTimeout[0][permission.id] === null" />
                  </v-col>
                  <v-col align-self="center" cols="auto"
                    v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
                    <v-btn icon
                      @click="settings.__permission_based__.spam_filter.cSpamTimeout[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.spam_filter.cSpamTimeout[0])">
                      <v-icon>
                        {{ settings.__permission_based__.spam_filter.cSpamTimeout[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}
                      </v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
              </v-tab-item>
            </permission-tabs>
          </v-card-text>
        </v-card>
      </v-tab-item>
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <permission-tabs v-slot:default="{permissions}"
              :ignored="getIgnoredPermissions(settings, 'symbols_filter')">
              <v-tab-item v-for="permission of permissions" :key="permission.id" eager>
                <v-row>
                  <v-col>
                    <v-layout row wrap align-baseline class="ma-0">
                      <v-switch class="mb-1" hide-details
                        :label="translate('systems.moderation.settings.cSymbolsEnabled')"
                        :input-value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.symbols_filter.cSymbolsEnabled[0])"
                        @change="settings.__permission_based__.symbols_filter.cSymbolsEnabled[0][permission.id] = $event"
                        :disabled="settings.__permission_based__.symbols_filter.cSymbolsEnabled[0][permission.id] === null" />
                      <v-btn v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'" icon
                        @click="settings.__permission_based__.symbols_filter.cSymbolsEnabled[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.symbols_filter.cSymbolsEnabled[0])">
                        <v-icon>
                          {{ settings.__permission_based__.symbols_filter.cSymbolsEnabled[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}
                        </v-icon>
                      </v-btn>
                    </v-layout>
                  </v-col>
                </v-row>
                <v-row class="mt-0">
                  <v-col>
                    <v-text-field type="number" class="mb-1" hide-details min="0"
                      :label="translate('systems.moderation.settings.cSymbolsTriggerLength')"
                      :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.symbols_filter.cSymbolsTriggerLength[0])"
                      @input="settings.__permission_based__.symbols_filter.cSymbolsTriggerLength[0][permission.id] = Number($event)"
                      :rules="[required, minValue(1)]"
                      :disabled="settings.__permission_based__.symbols_filter.cSymbolsTriggerLength[0][permission.id] === null" />
                  </v-col>
                  <v-col align-self="center" cols="auto"
                    v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
                    <v-btn icon
                      @click="settings.__permission_based__.symbols_filter.cSymbolsTriggerLength[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.symbols_filter.cSymbolsTriggerLength[0])">
                      <v-icon>
                        {{ settings.__permission_based__.symbols_filter.cSymbolsTriggerLength[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}
                      </v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
                <v-row class="mt-0">
                  <v-col>
                    <v-text-field type="number" class="mb-1" hide-details min="0"
                      :label="translate('systems.moderation.settings.cSymbolsMaxSymbolsConsecutively')"
                      :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.symbols_filter.cSymbolsMaxSymbolsConsecutively[0])"
                      @input="settings.__permission_based__.symbols_filter.cSymbolsMaxSymbolsConsecutively[0][permission.id] = Number($event)"
                      :rules="[required, minValue(1)]"
                      :disabled="settings.__permission_based__.symbols_filter.cSymbolsMaxSymbolsConsecutively[0][permission.id] === null" />
                  </v-col>
                  <v-col align-self="center" cols="auto"
                    v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
                    <v-btn icon
                      @click="settings.__permission_based__.symbols_filter.cSymbolsMaxSymbolsConsecutively[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.symbols_filter.cSymbolsMaxSymbolsConsecutively[0])">
                      <v-icon>
                        {{ settings.__permission_based__.symbols_filter.cSymbolsMaxSymbolsConsecutively[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}
                      </v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
                <v-row class="mt-0">
                  <v-col>
                    <v-text-field type="number" class="mb-1" hide-details min="0"
                      :label="translate('systems.moderation.settings.cSymbolsMaxSymbolsPercent')"
                      :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.symbols_filter.cSymbolsMaxSymbolsPercent[0])"
                      @input="settings.__permission_based__.symbols_filter.cSymbolsMaxSymbolsPercent[0][permission.id] = Number($event)"
                      :rules="[required, minValue(1), maxValue(100)]"
                      :disabled="settings.__permission_based__.symbols_filter.cSymbolsMaxSymbolsPercent[0][permission.id] === null" />
                  </v-col>
                  <v-col align-self="center" cols="auto"
                    v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
                    <v-btn icon
                      @click="settings.__permission_based__.symbols_filter.cSymbolsMaxSymbolsPercent[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.symbols_filter.cSymbolsMaxSymbolsPercent[0])">
                      <v-icon>
                        {{ settings.__permission_based__.symbols_filter.cSymbolsMaxSymbolsPercent[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}
                      </v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
                <v-row class="mt-0">
                  <v-col>
                    <v-text-field type="number" class="mb-1" hide-details min="0"
                      :label="translate('systems.moderation.settings.cSymbolsTimeout')"
                      :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.symbols_filter.cSymbolsTimeout[0])"
                      @input="settings.__permission_based__.symbols_filter.cSymbolsTimeout[0][permission.id] = Number($event)"
                      :rules="[required, minValue(1)]"
                      :disabled="settings.__permission_based__.symbols_filter.cSymbolsTimeout[0][permission.id] === null" />
                  </v-col>
                  <v-col align-self="center" cols="auto"
                    v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
                    <v-btn icon
                      @click="settings.__permission_based__.symbols_filter.cSymbolsTimeout[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.symbols_filter.cSymbolsTimeout[0])">
                      <v-icon>
                        {{ settings.__permission_based__.symbols_filter.cSymbolsTimeout[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}
                      </v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
              </v-tab-item>
            </permission-tabs>
          </v-card-text>
        </v-card>
      </v-tab-item>
    </v-tabs-items>
  </v-form>
</template>

<script lang="ts">
import { mdiLock, mdiLockOpenVariant } from '@mdi/js';
import { useStore } from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineAsyncComponent,
  defineComponent, nextTick, onMounted, ref, watch,
} from '@vue/composition-api';

import { error } from '~/functions/error';
import { getIgnoredPermissions } from '~/functions/getIgnoredPermissions';
import { getPermissionSettingsValue } from '~/functions/getPermissionSettingsValue';
import { saveSettings } from '~/functions/settings';
import { togglePermissionLock } from '~/functions/togglePermissionLock';
import {
  maxValue, minValue, required,
} from '~/functions/validators';

export default defineComponent({
  components: {
    permissionTabs:  defineAsyncComponent(() => import('~/components/settings/modules/permissionTabs.vue')),
    revertTextField: defineAsyncComponent(() => import('~/components/settings/modules/revert-text-field.vue')),
  },
  setup () {
    const settings = ref(null as Record<string, any> | null);
    const ui = ref(null as Record<string, any> | null);
    const store = useStore<any>();
    const valid = ref(true);
    const tab = ref(null);
    const maskBlacklist = ref(true);

    const test = (a:any) => {
      console.log({ a });
    };

    watch(settings, () => {
      store.commit('settings/pending', true);
    }, { deep: true });

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/systems/moderation', store, settings.value);
      }
    });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    onMounted(() => {
      getSocket(`/systems/moderation`)
        .emit('settings', (err: string | null, _settings: { [x: string]: any }, _ui: { [x: string]: { [attr: string]: any } }) => {
          if (err) {
            error(err);
            return;
          }
          ui.value = _ui;
          console.log({ _settings });
          settings.value = _settings;
          nextTick(() => { store.commit('settings/pending', false); });
        });
    });

    return {
      settings,
      ui,
      translate,
      valid,
      tab,
      maskBlacklist,

      // functions
      getIgnoredPermissions,
      getPermissionSettingsValue,
      togglePermissionLock,
      test,

      // validators
      required,
      minValue,
      maxValue,

      // icons
      mdiLock,
      mdiLockOpenVariant,
    };
  },
});
</script>
