import { appConfig } from '../../shared/config';
import mkdirp = require('mkdirp');
import * as fs from 'fs';
import { ServiceDatabase } from '../database/database.service';
import { ICachePackage } from '../../shared/interfaces/cache/i-cache-package';
import rimraf = require('rimraf');
import { ICachePackageVersion } from '../../shared/interfaces/cache/i-cache-package-version';

export class ServiceCache {
  public static get cachePath () {
    return `${appConfig.folderRoot}/.cache`;
  }

  constructor (private serviceDatabase: ServiceDatabase) {
  }

  public set (name: string, version: string, filePath: string): Promise<ICachePackage> {
    return new Promise<ICachePackage>((resolve, reject) => {
      const fileName = `${name}-${version}.tar.gz`;
      const folder = `${ServiceCache.cachePath}/${name}/${version}`;
      const fileCopyPath = `${folder}/${fileName}`;

      mkdirp.sync(folder);

      const readStream = fs.createReadStream(filePath);
      readStream.on('error', (err) => {
        reject(err);
      });

      const writeStream = fs.createWriteStream(fileCopyPath);

      writeStream.on('close', async () => {
        try {
          const existingPackage = await this.getPackage(name);
          existingPackage.versions.push({
            name: version,
            archivePath: fileCopyPath,
          });

          await this.serviceDatabase.cache.put(existingPackage);

        } catch {
          await this.serviceDatabase.cache.put<ICachePackage>({
            _id: name,
            name,
            versions: [
              {
                name: version,
                archivePath: fileCopyPath,
              },
            ],
          });
        }

        resolve(await this.serviceDatabase.cache.get<ICachePackage>(name));
      });

      readStream.pipe(writeStream);
    });
  }

  public async getPackage (name: string): Promise<ICachePackage> {
    if (!await this.hasPackage(name)) {
      throw new Error('Package does not exist');
    }

    return await this.serviceDatabase.cache.get<ICachePackage>(name);
  }

  public async getPackageVersion (name: string, version: string): Promise<ICachePackageVersion> {
    if (!await this.hasPackageVersion(name, version)) {
      throw new Error('Package version does not exist');
    }

    const result = await this.serviceDatabase.cache.get<ICachePackage>(name);

    return result.versions.find((v) => v.name === version) as ICachePackageVersion;
  }

  public async hasPackage (name: string) {
    let packageEntry: ICachePackage;
    try {
      packageEntry = await this.serviceDatabase.cache.get<ICachePackage>(name);
    } catch {
      return false;
    }

    return packageEntry !== undefined;
  }

  public async hasPackageVersion (name: string, version: string) {
    let packageEntry: ICachePackage;
    try {
      packageEntry = await this.serviceDatabase.cache.get<ICachePackage>(name);
    } catch {
      return false;
    }

    return packageEntry.versions.find((v) => v.name === version) !== undefined;
  }

  public async clear () {
    rimraf.sync(ServiceCache.cachePath);
    await this.serviceDatabase.destroy();
  }
}
