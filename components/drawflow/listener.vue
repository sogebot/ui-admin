<template>
  <div>
                      <v-toolbar dense color="blue-grey darken-4">
      <v-icon color="white" left>mdi-ear-hearing</v-icon>
                        <v-toolbar-title class="text-button white--text">
        Event listener
                        </v-toolbar-title>
                      </v-toolbar>
    <v-select dark :items="['Event1', 'Event2']" hide-details="auto" class="pa-4"/>
  </div>
</template>