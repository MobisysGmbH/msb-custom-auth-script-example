import type {
  CustomAuthApi,
  CustomAuthHttpClient,
  CustomAuthLogger,
  CustomAuthProfile,
  CustomAuthentication,
  ScriptSettings,
  CustomAuthDeviceInfo,
  CustomAuthVersionInfo,
} from '@mobisysgmbh/msb-custom-auth-api';

interface CustomAuthSettings {
  hideCredentialInputs: boolean;
  user: string;
  password: string;
  someTimeout: string;
  allowReauthentication: boolean;
  loginType: 'employee' | 'guest' | 'admin';
}

interface AuthenticationData {
  headers: Record<string, string>;
}

interface UrlParams {
  host: string;
  port: number;
  service: string;
  sapClient: number;
  queryParams: string;
  additionalQueryParams?: Record<string, string>;
}

export default class CustomAuthenticationImpl implements CustomAuthentication {
  private scriptSettings: ScriptSettings<CustomAuthSettings>;
  private http: CustomAuthHttpClient;
  private logger: CustomAuthLogger;
  private deviceInfo: CustomAuthDeviceInfo;
  private versionInfo: CustomAuthVersionInfo;

  constructor(
    scriptSettings: ScriptSettings<CustomAuthSettings>,
    customAuthApi: CustomAuthApi,
  ) {
    this.scriptSettings = scriptSettings;

    this.http = customAuthApi.http;
    this.logger = customAuthApi.logger;
    this.deviceInfo = customAuthApi.deviceInfo;
    this.versionInfo = customAuthApi.versionInfo;
  }

  async login(profile: CustomAuthProfile): Promise<Record<string, string>> {
    let user: string;
    let password: string;

    if (this.scriptSettings.hideCredentialInputs) {
      user = this.scriptSettings.user;
      password = this.scriptSettings.password;
    } else {
      user = profile.currentUser;
      password = profile.currentPassword;
    }

    const encoded = btoa(`${user}:${password}`);

    const authenticationData = {
      headers: Object.freeze({
        authorization: `Basic ${encoded}`,
        uid: encoded,
      }),
    };

    this.logger.log('checking credentials');

    await this.checkPassword(profile, authenticationData);

    return authenticationData.headers;
  }

  async logout(profile: CustomAuthProfile): Promise<void> {}

  private async checkPassword(
    profile: CustomAuthProfile,
    authenticationData: AuthenticationData,
  ): Promise<void> {
    const headers = {
      ...(await this.getRequestHeaders('PWCHK', {
        authenticationData,
      })),
    };

    const response = await this.http.post({
      url: this.build(profile),
      headers,
      body: '',
    });

    if (response.error !== undefined) {
      throw new Error(`Login failed. Code: ${response.status}`);
    }
  }

  private async getRequestHeaders(
    method: string,
    headerParams: any,
  ): Promise<Record<string, string>> {
    return {
      ...headerParams.authenticationData.headers,
      cntrl: this.getCntrlHeader(method, headerParams.sessionId),

      mac: 'CUSTOMAUTHTEST',

      // accept-language must be empty, otherwise SAP may get confused and uses the wrong service
      'accept-language': '',

      // The header field caps is used to tell the MSB which features are supported by the MSB Client.
      // 0: 1 if the new logic for BALIGN_TXT/FALIGN and the image properties is supported
      // 1: 1 if the offline mode is supported
      // 2: 1 if the device independent licenses are supported
      // 3: 1 if character stuffing is supported
      // 4: 1 if network protocol is supported
      // 5: 1 if EVT section is supported
      caps: '111111',

      // Safari on IOS 6 caches post responses when cache-control is not set
      'cache-control': 'no-cache',
    };
  }

  getDeviceInfoHeaders(customDeviceTag = '') {
    return {
      // additional headers for the extended device management of the MSB 4.0
      os: this.deviceInfo.getOs(),
      oem: this.deviceInfo.getOem(),
      'device-tag1': customDeviceTag,
      'device-text': this.deviceInfo.getDeviceDescription(),
      'device-name': this.deviceInfo.getDeviceName(),
      'device-serial': this.deviceInfo.getSerial(),
      lictype: '8',
    };
  }

  private getCntrlHeader(method: string, sessionId?: string): string {
    return (
      this.padRight(method, 5, ' ') +
      this.getVersionString() +
      (sessionId || '')
    );
  }

  private async getVersionString(): Promise<string> {
    const sapVersion = this.versionInfo.getSapVersion();

    if (await this.deviceInfo.isIPad()) {
      return `IPADXX${sapVersion}`;
    }

    if (await this.deviceInfo.isIOs()) {
      return `IOSXXX${sapVersion}`;
    }

    if (await this.deviceInfo.isAndroid()) {
      return `DROIDX${sapVersion}`;
    }

    if (await this.deviceInfo.isElectron()) {
      return `NODEXX${sapVersion}`;
    }

    return `XXXXXX${sapVersion}`;
  }

  build(params: UrlParams): string {
    const service = params.service.startsWith('/')
      ? params.service.slice(1)
      : params.service;

    const queryParams = [
      `sap-client=${this.padLeft(params.sapClient.toString(), 3, '0')}`,
      `sap-language=DE`,
      ...this.splitQueryParams(params.queryParams),
    ];

    if (params.additionalQueryParams) {
      queryParams.push(
        ...Object.entries(params.additionalQueryParams).map(
          ([key, value]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
        ),
      );
    }

    return `https://${params.host}:${params.port}/${service}?${queryParams.join(
      '&',
    )}`;
  }

  private splitQueryParams(queryParams: string): string[] {
    return queryParams
      .split(',')
      .map((param) => param.trim())
      .filter(Boolean);
  }

  padLeft(text: string, desiredLength: number, filler: string): string {
    let paddedText = text;

    while (paddedText.length < desiredLength) {
      paddedText = filler + paddedText;
    }

    return paddedText;
  }

  padRight(text: string, desiredLength: number, filler: string): string {
    let paddedText = text || '';

    while (paddedText.length < desiredLength) {
      paddedText += filler;
    }

    return paddedText;
  }

  trim(text: string): string {
    return text.replace(/^\s+|\s+$/g, '');
  }

  trimStart(text: string, charToRemove: string): string {
    let copy = text;

    while (copy.startsWith(charToRemove)) {
      copy = copy.slice(1);
    }

    return copy;
  }

  camelCase2snakeCase(text: string): string {
    // won't work for non ASCII set letters, but is okay for this purpose
    return text.replace(/([A-Z])/g, '_$1').toLowerCase();
  }

  snakeCase2camelCase(text: string): string {
    return text
      .split('_')
      .reduce(
        (acc, value, index) =>
          acc + (index > 0 ? this.upperCaseFirstLetter(value) : value),
        '',
      );
  }

  pascalCaseToCamelCase(text: string): string {
    const firstChar = text[0];

    if (!firstChar) {
      return '';
    }

    // eslint-disable-next-line unicorn/prefer-spread
    return firstChar.toLowerCase().concat(text.slice(1));
  }

  upperCaseFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  isString(text: string): text is string {
    return typeof text === 'string';
  }
}
