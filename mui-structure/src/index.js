// Barrel exports for @project/mui-structure
// Consumers can do:
//   import { UIShell, Sidebar, Topbar, theme, designTokens } from '@project/mui-structure'

export { default as UIShell } from './components/UIShell';
export { default as Sidebar } from './components/Sidebar';
export { default as Topbar } from './components/Topbar';
export { default as theme } from './theme/theme';

// designTokens re-exports the named constants as a single namespace object
export * as designTokens from './tokens/designTokens';
