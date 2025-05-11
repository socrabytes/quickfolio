/**
 * Lynx theme registration
 */
import { Theme, registerTheme } from '../index';
import { MVPContentData } from '../../types/mvp';
import LynxPreview from './preview';
import generateLynxConfig from './generator';
import meta from './meta.json';

// Register the Lynx theme
const lynxTheme: Theme = {
  meta,
  previewComponent: LynxPreview,
  generator: generateLynxConfig
};

// Register this theme with the registry
registerTheme(lynxTheme);

export default lynxTheme;
