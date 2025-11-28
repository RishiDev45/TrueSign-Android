import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './TrueSignModule.types';

type TrueSignModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class TrueSignModule extends NativeModule<TrueSignModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(TrueSignModule, 'TrueSignModule');
