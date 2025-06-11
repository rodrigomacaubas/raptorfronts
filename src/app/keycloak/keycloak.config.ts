import { KeycloakOptions } from 'keycloak-angular';

export const keycloakConfig: KeycloakOptions = {
  config: {
    url: 'http://192.168.1.122:9097',
    realm: 'raptor',
    clientId: 'angular-client'
  },
  initOptions: {
    onLoad: 'login-required',
    checkLoginIframe: false,
    silentCheckSsoRedirectUri: window.location.origin + '/assets/silent-check-sso.html'
  },
  bearerExcludedUrls: ['/assets']
};