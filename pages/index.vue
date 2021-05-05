<template>
  <v-container fluid>
    <v-row dense>
      <v-col cols="12" md="8" sm="8">
        <v-card width="100%" class="mb-2">
          <v-toolbar dense color="blue-grey darken-4" class="mb-1">
            <small class="text-caption">Eventlist</small>
          </v-toolbar>

          Eventlist
        </v-card>
      </v-col>
      <v-col cols="12" md="4" sm="4">
        <v-card width="100%" class="mb-2">
          <v-toolbar dense color="blue-grey darken-4" class="mb-1">
            <small class="text-caption">Chat</small>
          </v-toolbar>

          bla bla iframe
        </v-card>
        <v-card width="100%" class="mb-2">
          <v-toolbar dense color="blue-grey darken-4" class="mb-1">
            <small class="text-caption">Twitch Monitor</small>
          </v-toolbar>

          bla bla iframe
        </v-card>
        <v-card width="100%" class="mb-2">
          <v-toolbar dense color="blue-grey darken-4" class="mb-1">
            <small class="text-caption">Quick actions</small>
          </v-toolbar>
          <!--v-col md="2" lg="1" sm="3" xs="4"-->
          <v-row dense>
            <v-col cols="12" lg="6">
              <v-card color="primary" elevation="2" height="100%" @click="() => {}">
                <v-card-text class="text-caption pa-1 ma-0 text-center">
                  <strong>Add 5 to $_test</strong>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

</template>

<script>
export default { };
</script>
