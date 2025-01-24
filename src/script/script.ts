import type {
  CustomAuthApi,
  CustomAuthProfile,
  CustomAuthentication,
  ScriptSettings,
  AuthConfig,
  CustomAuthNfc,
} from '@mobisysgmbh/msb-custom-auth-api';

interface CustomAuthSettings {
  hideCredentialInputs: boolean;
  user: string;
  password: string;
  someTimeout: string;
  allowReauthentication: boolean;
}

// interface NfcUserData {
//   user: string;
// }

export default class CustomAuthenticationImpl implements CustomAuthentication {
  private nfc: CustomAuthNfc;

  constructor(
    scriptSettings: ScriptSettings<CustomAuthSettings>,
    customAuthApi: CustomAuthApi,
  ) {
    this.nfc = customAuthApi.nfc;
  }

  async login(profile: CustomAuthProfile): Promise<AuthConfig> {
    const userInput = document.createElement('input');
    const passwordInput = document.createElement('input');
    const loginButton = document.createElement('button');
    const loginDiv = document.createElement('div');
    const userDiv = document.createElement('div');
    const passwordDiv = document.createElement('div');
    const loginButtonDiv = document.createElement('div');

    userInput.placeholder = 'User';
    userInput.addEventListener('focus', () => {
      this.nfc.startNfcCapture((data) => {
        // const parsedData = JSON.parse(data) as NfcUserData;
        userInput.value = data;
      });
    });

    userInput.addEventListener('blur', () => {
      this.nfc.stopNfcCapture();
    });

    passwordInput.placeholder = 'Password';
    passwordInput.type = 'password';

    loginButton.style.padding = '2rem';
    loginButton.style.width = '-webkit-fill-available';
    loginButton.innerText = 'Log in';

    loginDiv.style.zIndex = '1000';
    loginDiv.style.display = 'flex';
    loginDiv.style.flexFlow = 'column';
    loginDiv.style.position = 'absolute';
    loginDiv.style.width = '100%';
    loginDiv.style.height = '100%';
    loginDiv.style.backgroundColor = 'white';
    loginDiv.style.textAlign = 'center';

    userDiv.style.padding = '1rem';
    passwordDiv.style.padding = '1rem';
    loginButtonDiv.style.padding = '1rem';

    userDiv.append(userInput);
    passwordDiv.append(passwordInput);
    loginButtonDiv.append(loginButton);

    loginDiv.append(userDiv, passwordDiv, loginButtonDiv);
    document.body.append(loginDiv);

    return new Promise((resolve) => {
      loginButton.addEventListener('click', async () => {
        const encoded = btoa(`${userInput.value}:${passwordInput.value}`);

        const authConfig: AuthConfig = {
          headers: Object.freeze({
            authorization: `Basic ${encoded}`,
            uid: encoded,
          }),
          authOptions: {
            msbAuthentication: 'basic',
            useCustomHeaders: true,
          },
        };
        loginDiv.remove();
        resolve(authConfig);
      });
    });
  }

  async logout(profile: CustomAuthProfile): Promise<void> {}
}
