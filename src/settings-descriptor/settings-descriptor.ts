import type { ScriptSettingsDescriptor } from '@mobisysgmbh/msb-custom-auth-api';

export const descriptor: ScriptSettingsDescriptor = {
  hideCredentialInputsScriptItem: {
    key: 'hideCredentialInputs',
    description: 'Hide credential inputs',
    dataType: 'Boolean',
    defaultValue: true,
    uiType: 'Checkbox',
  },

  scriptItems: [
    {
      key: 'pollingInterval',
      description: 'Polling Intervall',
      dataType: 'Number',
      defaultValue: 5000,
      uiType: 'Text',
    },
    {
      key: 'authMethod',
      description: 'Authentifizierungsmethode',
      dataType: 'Enumeration',
      enumValues: ['Basic', 'WebForm', 'ClientCert'],
      defaultValue: 'WebForm',
      uiType: 'Selection',
      enumType: {},
    },
  ],
};
