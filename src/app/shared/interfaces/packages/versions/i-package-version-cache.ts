import { IPouchModel } from '../../pouch-db/i-pouch-model';

export interface IPackageVersionCache extends IPouchModel {
  package: string;
  version: string;
}
