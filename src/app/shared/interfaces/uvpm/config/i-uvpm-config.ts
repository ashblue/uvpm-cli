import { IUvpmPackageCollection } from './i-uvpm-config-package-collection';
import { IUvpmConfigPublishing } from './i-uvpm-config-publishing';
import { ModelVersion } from '../../../../models/version/version.model';

export interface IUvpmConfig {
  name: string;
  version?: ModelVersion|string;
  author?: string;
  homepage?: string;
  description?: string;
  license?: string;
  dependencies?: IUvpmPackageCollection;
  publishing?: IUvpmConfigPublishing;
}
