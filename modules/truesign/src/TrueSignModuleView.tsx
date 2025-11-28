import { requireNativeView } from 'expo';
import * as React from 'react';

import { TrueSignModuleViewProps } from './TrueSignModule.types';

const NativeView: React.ComponentType<TrueSignModuleViewProps> =
  requireNativeView('TrueSignModule');

export default function TrueSignModuleView(props: TrueSignModuleViewProps) {
  return <NativeView {...props} />;
}
