import { IPackageVersion } from '../../shared/interfaces/packages/versions/i-package-version';
import { ModelPackageVersionCache } from '../../models/package-version-cache/package-version-cache.model';
import { ServiceDatabase } from '../database/database.service';
import { IPackageVersionCache } from '../../shared/interfaces/packages/versions/i-package-version-cache';
import axios, { AxiosResponse } from 'axios';

export class ServicePackageVersionCache {
  constructor (private db: ServiceDatabase) {
  }

  public create (packageId: string, version: IPackageVersion): Promise<ModelPackageVersionCache> {
    return new Promise<ModelPackageVersionCache>(async (resolve, reject) => {
      let file: AxiosResponse<any>;
      try {
        file = await axios.get(version.archive);
      } catch (err) {
        reject(`Failed to download file. Details: ${err}`);
        return;
      }

      const buffer = new Buffer(file.data);

      const cache: IPackageVersionCache = {
        _id: `${packageId}-${version.name}`,
        package: packageId,
        version: version.name,
        _attachments: {
          archive: {
            content_type: 'text/plain',
            data: buffer,
          },
        },
      };

      const cacheUpdate = await this.db.packageVersionCache.post(cache);
      const doc: IPackageVersionCache = await this.db.packageVersionCache.get(
        cacheUpdate.id,
        {
          attachments: true,
        }) as any;

      const model = new ModelPackageVersionCache(doc);

      resolve(model);
    });
  }

  public get (packageId: string, versionId: string): Promise<ModelPackageVersionCache> {
    return new Promise<ModelPackageVersionCache>((resolve) => {
      console.log(packageId, versionId);
      resolve();
    });
  }

  public destroy (packageId: string, version?: string): Promise<ModelPackageVersionCache> {
    return new Promise<ModelPackageVersionCache>((resolve) => {
      console.log(packageId, version);
      resolve();
    });
  }
}
