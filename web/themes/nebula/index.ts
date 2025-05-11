/**
 * Nebula dark cards theme registration
 */
import { Theme, registerTheme } from '../index';
import { MVPContentData } from '../../types/mvp';
import NebulaPreview from './preview';
import generateNebulaHTML from './generator';
import meta from './meta.json';

// Register the Nebula theme
const nebulaTheme: Theme = {
  meta,
  previewComponent: NebulaPreview,
  generator: generateNebulaHTML
};

// Register with the registry
registerTheme(nebulaTheme);

export default nebulaTheme;
