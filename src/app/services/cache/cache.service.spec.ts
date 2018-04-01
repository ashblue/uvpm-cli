import * as chai from 'chai';
import { ServiceCache } from './cache.service';
import * as tmp from 'tmp';
import * as fs from 'fs';
import * as sinon from 'sinon';
import { Stream } from 'stream';
import { SynchrounousResult } from 'tmp';
import { ServiceDatabase } from '../database/database.service';
import { ICachePackage } from '../../shared/interfaces/cache/i-cache-package';
import { ICachePackageVersion } from '../../shared/interfaces/cache/i-cache-package-version';

const expect = chai.expect;

describe('ServiceCache', () => {
  const packageName = 'my-package';
  const packageVersion = '1.0.0';

  const fileFolder = `${ServiceCache.cachePath}/${packageName}`;
  const filePath = `${fileFolder}/${packageVersion}/${packageName}-${packageVersion}.tar.gz`;
  let file: SynchrounousResult;

  let serviceCache: ServiceCache;
  let serviceDatabase: ServiceDatabase;

  beforeEach(() => {
    serviceDatabase = new ServiceDatabase();
    serviceCache = new ServiceCache(serviceDatabase);

    file = tmp.fileSync();
  });

  it('should initialize', () => {
    expect(serviceCache).to.be.ok;
  });

  describe('set', () => {
    describe('success', () => {
      it('should save a file under the package name and version to a file globally', async () => {
        await serviceCache.set(packageName, packageVersion, file.name);

        expect(fs.existsSync(filePath)).to.be.ok;
      });

      it('should store a reference in the database service cache', async () => {
        const expectedResult: ICachePackage = {
          _id: packageName,
          name: packageName,
          versions: [
            {
              name: packageVersion,
              archivePath: filePath,
            },
          ],
        };

        await serviceCache.set(packageName, packageVersion, file.name);

        const result = await serviceDatabase.cache.get(packageName);
        delete result._rev;

        expect(result).to.deep.eq(expectedResult);
      });

      it('should return the injected database result', async () => {
        const expectedResult: ICachePackage = {
          _id: packageName,
          name: packageName,
          versions: [
            {
              name: packageVersion,
              archivePath: filePath,
            },
          ],
        };

        const result = await serviceCache.set(packageName, packageVersion, file.name);
        delete result._rev;

        expect(result).to.deep.eq(expectedResult);
      });

      it('should append new versions to the package if set is called again', async () => {
        const packageVersionNew = '2.0.0';
        const filePathNew = `${fileFolder}/${packageVersionNew}/${packageName}-${packageVersionNew}.tar.gz`;
        const fileNew = tmp.fileSync();

        const expectedResult: ICachePackage = {
          _id: packageName,
          name: packageName,
          versions: [
            {
              name: packageVersion,
              archivePath: filePath,
            },
            {
              name: packageVersionNew,
              archivePath: filePathNew,
            },
          ],
        };

        await serviceCache.set(packageName, packageVersion, file.name);
        await serviceCache.set(packageName, packageVersionNew, fileNew.name);

        const result = await serviceDatabase.cache.get(packageName);
        delete result._rev;

        expect(result).to.deep.eq(expectedResult);
      });
    });

    describe('failure', () => {
      it('should catch an error if file path does not exist', async () => {
        let errMsg: any;
        try {
          await serviceCache.set(packageName, packageVersion, '');
        } catch (err) {
          errMsg = err;
        }

        expect(errMsg).to.be.ok;
      });

      it('should catch read stream errors', async () => {
        const errText = 'my err';
        const stream = new Stream();
        const stubReadStream = sinon.stub(fs, 'createReadStream').callsFake(() => {
          return stream;
        });

        let errMsg: any;
        try {
          stream.emit('error', new Error(errText));
          await serviceCache.set(packageName, packageVersion, file.name);
        } catch (err) {
          errMsg = err;
        } finally {
          stubReadStream.restore();
        }

        expect(errMsg.toString()).to.eq(`Error: ${errText}`);
      });

      it('should catch write stream errors', async () => {
        const errText = 'my err';
        const stream = new Stream();
        const stubWriteStream = sinon.stub(fs, 'createWriteStream').callsFake(() => {
          return stream;
        });

        let errMsg: any;
        try {
          stream.emit('error', new Error(errText));
          await serviceCache.set(packageName, packageVersion, file.name);
        } catch (err) {
          errMsg = err;
        } finally {
          stubWriteStream.restore();
        }

        expect(errMsg.toString()).to.eq(`Error: ${errText}`);
      });
    });
  });

  describe('hasPackageVersion', () => {
    it('should return true if the requested package and version exists', async () => {
      await serviceCache.set(packageName, packageVersion, file.name);

      const result = await serviceCache.hasPackageVersion(packageName, packageVersion);

      expect(result).to.be.ok;
    });

    it('should return false if the requested package does not exist', async () => {
      const result = await serviceCache.hasPackageVersion(packageName, packageVersion);

      expect(result).to.be.not.ok;
    });

    it('should return false if the requested package exists, but the version is missing', async () => {
      await serviceCache.set(packageName, packageVersion, file.name);

      const result = await serviceCache.hasPackageVersion(packageName, '2.0.0');

      expect(result).to.be.not.ok;
    });
  });

  describe('hasPackage', () => {
    it('should return true if the requested package exists', async () => {
      await serviceCache.set(packageName, packageVersion, file.name);

      const result = await serviceCache.hasPackage(packageName);

      expect(result).to.be.ok;
    });

    it('should return false if the requested package does not exist', async () => {
      const result = await serviceCache.hasPackage(packageName);

      expect(result).to.be.not.ok;
    });
  });

  describe('getPackage', () => {
    it('should return the package', async () => {
      const expectedResult: ICachePackage = {
        _id: packageName,
        name: packageName,
        versions: [
          {
            name: packageVersion,
            archivePath: filePath,
          },
        ],
      };

      await serviceCache.set(packageName, packageVersion, file.name);
      const result = await serviceCache.getPackage(packageName);
      if (result) {
        delete result._rev;
      }

      expect(result).to.deep.eq(expectedResult);
    });

    it('should fail if the package does not exist', async () => {
      let errMsg: any;
      try {
        await serviceCache.getPackage(packageName);
      } catch (err) {
        errMsg = err;
      }

      expect(errMsg).to.be.ok;
    });
  });

  describe('getPackageVersion', () => {
    it('should return the package version', async () => {
      const expectedResult: ICachePackageVersion = {
        name: packageVersion,
        archivePath: filePath,
      };

      await serviceCache.set(packageName, packageVersion, file.name);
      const result = await serviceCache.getPackageVersion(packageName, packageVersion);

      expect(result).to.deep.eq(expectedResult);
    });

    it('should fail if the package does not exist', async () => {
      let errMsg: any;
      try {
        await serviceCache.getPackageVersion(packageName, packageVersion);
      } catch (err) {
        errMsg = err;
      }

      expect(errMsg).to.be.ok;
    });

    it('should fail if the package version does not exist on an existing package', async () => {
      await serviceCache.set(packageName, packageVersion, file.name);

      let errMsg: any;
      try {
        await serviceCache.getPackageVersion(packageName, '2.0.0');
      } catch (err) {
        errMsg = err;
      }

      expect(errMsg).to.be.ok;
    });
  });

  describe('clear', () => {
    it('should remove all existing package database entries', async () => {
      await serviceCache.set(packageName, packageVersion, file.name);
      await serviceCache.clear();

      const result = await serviceCache.hasPackage(packageName);

      expect(result).to.be.not.ok;
    });

    it('should remove all existing file entries', async () => {
      await serviceCache.set(packageName, packageVersion, file.name);
      await serviceCache.clear();

      expect(fs.existsSync(ServiceCache.cachePath)).to.be.not.ok;
    });
  });
});
