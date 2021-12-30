export const state = () => ({
  loggedUser:        null,
  configuration:     null,
  currentGame:       '',
  currentTitle:      '',
  currentTags:       [],
  loadingMsg:        '',
  isUILoaded:        false,
  areUIStatsHidden:  localStorage.getItem('$store.areUIStatsHidden') === 'true',
  isMobile:          false,
  $core:             [],
  $services:         [],
  $systems:          [],
  $integrations:     [],
  navbarMiniVariant: false,
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
  $services (storeState: { $services: any[] }, value: any) {
    storeState.$services = value;
  },
  $systems (storeState: { $systems: any[] }, value: any) {
    storeState.$systems = value;
  },
  $integrations (storeState: { $integrations: any[] }, value: any) {
    storeState.$integrations = value;
  },
  setNavbarMiniVariant (storeState: { navbarMiniVariant: boolean }, value: boolean) {
    storeState.navbarMiniVariant = value;
  },
};
