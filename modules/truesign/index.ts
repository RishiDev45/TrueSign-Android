// Reexport the native module. On web, it will be resolved to TrueSignModule.web.ts
// and on native platforms to TrueSignModule.ts
export { default } from './src/TrueSignModule';
export { default as TrueSignModuleView } from './src/TrueSignModuleView';
export * from  './src/TrueSignModule.types';
