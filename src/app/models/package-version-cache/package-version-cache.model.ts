import { IPackageVersionCache } from '../../shared/interfaces/packages/versions/i-package-version-cache';

export class ModelPackageVersionCache implements IPackageVersionCache {
  public _id: string = '';
  public _rev: string = '';
  public _attachments?: {
    [file: string]: {
      content_type: 'text/plain',
      data: any,
    },
  };

  public package: string = '';
  public version: string = '';

  constructor (data?: IPackageVersionCache) {
    if (data) {
      Object.assign(this, data);
    }
  }
}
