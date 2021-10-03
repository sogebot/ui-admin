export default () => {
  return {
    httpEndpoint: location.origin + '/graphql',

    /*
     * For permanent authentication provide `getAuth` function.
     * The string returned will be used in all requests as authorization header
     */
    getAuth: () => 'Bearer ' + localStorage.accessToken,
  };
};
