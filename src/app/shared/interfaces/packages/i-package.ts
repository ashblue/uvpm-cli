import { IUser } from '../user/i-user';
import { IPackageVersion } from './versions/i-package-version';

export interface IPackage {
  name: string;
  author: IUser;
  versions: IPackageVersion[];
}
