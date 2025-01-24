import type { ScriptSettingsDescriptor } from '@mobisysgmbh/msb-custom-auth-api';

export const descriptor: ScriptSettingsDescriptor = {
  hideCredentialInputsScriptItem: {
    key: 'hideCredentialInputs',
    description: 'Hide credential inputs',
    dataType: 'Boolean',
    defaultValue: true,
    uiType: 'Checkbox',
  },
};
