export const state = () => ({
  loggedUser:       null,
  configuration:    null,
  currentGame:      '',
  currentTitle:     '',
  currentTags:      [],
  loadingMsg:       '',
  isUILoaded:       false,
  areUIStatsHidden: Boolean(localStorage.getItem('$store.areUIStatsHidden')),
  isMobile:         false,
  $core:            [],
  $systems:         [],
  $integrations:    [],
});

export const mutations = {
  setLoggedUser (storeState: { loggedUser: any; }, user: any) {
    storeState.loggedUser = user;
  },
  setConfiguration (storeState: { configuration: any; }, configuration: any) {
    storeState.configuration = configuration;
  },
  setCurrentGame (storeState: { currentGame: any; }, currentGame: any) {
    storeState.currentGame = currentGame;
  },
  setCurrentTitle (storeState: { currentTitle: any; }, currentTitle: any) {
    storeState.currentTitle = currentTitle;
  },
  setCurrentTags (storeState: { currentTags: any; }, currentTags: any) {
    storeState.currentTags = currentTags;
  },
  setLoadingMsg (storeState: { loadingMsg: any; }, loadingMsg: any) {
    storeState.loadingMsg = loadingMsg;
  },
  setUILoaded (storeState: { isUILoaded: boolean; }) {
    storeState.isUILoaded = true;
  },
  setUIStatsHidden (storeState: { areUIStatsHidden: boolean; }, value: boolean) {
    localStorage.setItem('$store.areUIStatsHidden', String(value));
    storeState.areUIStatsHidden = value;
  },
  setMobile (storeState: { isMobile: any; }, value: any) {
    storeState.isMobile = value;
  },
  $core (storeState: { $core: any[] }, value: any) {
    storeState.$core = value;
  },
  $systems (storeState: { $systems: any[] }, value: any) {
    storeState.$systems = value;
  },
  $integrations (storeState: { $integrations: any[] }, value: any) {
    storeState.$integrations = value;
  },
};
