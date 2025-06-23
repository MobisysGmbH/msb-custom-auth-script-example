import {
  type CustomAuthApi,
  type CustomAuthProfile,
  type CustomAuthentication,
  type ScriptSettings,
  type AuthConfig,
  CustomAuthForegroundHttp,
} from '@mobisysgmbh/msb-custom-auth-api';

interface CustomAuthSettings {
  hideCredentialInputs: boolean;
  pollingInterval: number;
  authMethod: 'Basic' | 'WebForm' | 'ClientCert';
}

export default class CustomAuthenticationImpl implements CustomAuthentication {
  private foregroundHttp: CustomAuthForegroundHttp;
  private scriptSettings: ScriptSettings<CustomAuthSettings>;

  constructor(
    scriptSettings: ScriptSettings<CustomAuthSettings>,
    customAuthApi: CustomAuthApi,
  ) {
    this.foregroundHttp = customAuthApi.foregroundHttp;
    this.scriptSettings = scriptSettings;
  }

  async login(profile: CustomAuthProfile): Promise<AuthConfig> {
    this.foregroundHttp.pollWithHttpGet(this.scriptSettings.pollingInterval);

    return new Promise((resolve) => {
      const authConfig: AuthConfig = {
        headers: {},
        authOptions: {
          msbAuthentication: this.getAuthenticationMethod(
            this.scriptSettings.authMethod,
          ),
          useCustomHeaders: false,
        },
      };

      resolve(authConfig);
    });
  }

  async logout(profile: CustomAuthProfile): Promise<void> {}

  getAuthenticationMethod(
    authMethod: 'Basic' | 'WebForm' | 'ClientCert',
  ): 'basic' | 'clientCert' | 'webForm' {
    switch (authMethod) {
      case 'Basic':
        return 'basic';

      case 'ClientCert':
        return 'clientCert';

      case 'WebForm':
        return 'webForm';

      default:
        throw new Error('set AuthMethod not supported');
    }
  }
}
