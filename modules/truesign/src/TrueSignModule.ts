import { NativeModule, requireNativeModule } from 'expo';

import { TrueSignModuleEvents } from './TrueSignModule.types';

declare class TrueSignModule extends NativeModule<TrueSignModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<TrueSignModule>('TrueSignModule');
