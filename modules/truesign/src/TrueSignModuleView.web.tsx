import * as React from 'react';

import { TrueSignModuleViewProps } from './TrueSignModule.types';

export default function TrueSignModuleView(props: TrueSignModuleViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
