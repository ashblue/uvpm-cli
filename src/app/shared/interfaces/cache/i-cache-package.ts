import { IPouchModel } from '../pouch-db/i-pouch-model';
import { ICachePackageVersion } from './i-cache-package-version';

export interface ICachePackage extends IPouchModel {
  name: string;
  versions: ICachePackageVersion[];
}
