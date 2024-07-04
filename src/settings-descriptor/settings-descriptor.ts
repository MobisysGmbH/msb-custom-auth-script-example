import type { ScriptSettingsDescriptor } from '@mobisysgmbh/msb-custom-auth-api';

export const descriptor: ScriptSettingsDescriptor = {
  hideCredentialInputsScriptItem: {
    key: 'hideCredentialInputs',
    description: 'Hide credential inputs',
    dataType: 'Boolean',
    defaultValue: false,
    uiType: 'Checkbox',
  },

  scriptItems: [
    {
      key: 'user',
      defaultValue: '',
      description: 'User',
      uiType: 'Text',
      dataType: 'String',
      case: 'Mixed',
    },
    {
      key: 'password',
      defaultValue: '',
      description: 'Password',
      uiType: 'Password',
      dataType: 'String',
      case: 'Mixed',
    },
    {
      key: 'someTimeout',
      defaultValue: '360',
      description: 'Timeout',
      uiType: 'Text',
      dataType: 'String',
      case: 'Mixed',
    },
    {
      key: 'allowReauthentication',
      defaultValue: true,
      description: 'Allow Reauthentication',
      uiType: 'Checkbox',
      dataType: 'Boolean',
    },
    {
      key: 'loginType',
      defaultValue: 'employee',
      description: 'Login type',
      uiType: 'Selection',
      enumValues: ['employee', 'guest', 'admin'],
      dataType: 'Enumeration',
      enumType: {},
    },
  ],
};
