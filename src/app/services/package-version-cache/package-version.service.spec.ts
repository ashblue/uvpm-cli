import * as chai from 'chai';
import { ServicePackageVersionCache } from './package-version.service';
import { ServiceDatabase } from '../database/database.service';
import * as nock from 'nock';
import { ModelProfile } from '../../models/profile/profile.model';
import * as fs from 'fs';
import { FolderGen } from '../../shared/tests/folder-gen';
import { ModelUvpmConfig } from '../../models/uvpm/uvpm-config.model';

const expect = chai.expect;

function setupFileDownload (db: ServiceDatabase,
                            url: string,
                            localFile: string,
                            fileData: string,
                            archiveName: string) {
  const profile = new ModelProfile(db);
  profile.server = url;

  fs.writeFileSync(localFile, fileData);

  // Fake HTTP response with a returned file
  nock(url)
    .get(`/${archiveName}`)
    .replyWithFile(200, localFile, {
      'Content-Type': 'text/plain',
    });
}

describe('ServicePackageVersionCache', () => {
  it('should initialize', () => {
    const s = new ServicePackageVersionCache(new ServiceDatabase());

    expect(s).to.be.ok;
  });

  describe('when initialized', () => {
    const packageName = 'my-package';
    const version = '1.0.0';
    const archiveName = 'my-archive.b2z';
    const url = 'http://test.com';
    const localFile = `.tmp/${archiveName}`;
    const archive = `${url}/${archiveName}`;

    let fileData: string;
    let serviceCache: ServicePackageVersionCache;
    let db: ServiceDatabase;

    before(() => {
      const config = new ModelUvpmConfig();

      const filePackage = new FolderGen([
        {
          path: '.',
          file: 'uvpm.json',
          contents: JSON.stringify(config),
        },
        {
          path: 'hello-world.txt',
          file: 'test',
          contents: 'Hello World',
        },
        {
          path: 'anoter-test/nested',
          file: 'lorem-ipsum.txt',
          contents: 'Lorem Ipsum',
        },
      ]);

      // @TODO This should be a helper class with associated data
      // @TODO Turn fileData into a b2z zip
      // uvpm.json in root
      // test/hello-world.txt in root
      // anoter-test/nested/lorem-ipsum.txt
      // Package folder structure into a zip
      // Turn zip data into a string

      fileData = 'zipped files';
    });

    beforeEach(() => {
      db = new ServiceDatabase();
      serviceCache = new ServicePackageVersionCache(db);
      setupFileDownload(db, url, localFile, fileData, archiveName);
    });

    describe('create', () => {
      it('should return a database entry for the cache', async () => {
        const model = await serviceCache.create(packageName, {
          name: version,
          archive,
        });

        expect(model).to.be.ok;
        expect(model.version).to.eq(version);
        expect(model.package).to.eq(packageName);
        expect(model._id).to.eq(`${packageName}-${version}`);
        expect(model._rev).to.be.ok;
      });

      it('should unpack the zip into a .cache folder', async () => {
        const cacheFolder = '.cache';
        const packageFolder = `${cacheFolder}/${packageName}`;
        const rootFolder = `${cacheFolder}/${packageName}/${version}`;

        const model = await serviceCache.create(packageName, {
          name: version,
          archive,
        });

        expect(model).to.be.ok;
        expect(fs.existsSync(cacheFolder)).to.be.ok;
        expect(fs.existsSync(packageFolder)).to.be.ok;
        expect(fs.existsSync(rootFolder)).to.be.ok;

        // @TODO Verify files have been unpacked successfully in proper places
      });

      xit('should attach the file as a PouchDB attachment after downloading it', async () => {
        const model = await serviceCache.create(packageName, {
          name: version,
          archive,
        });

        expect(model).to.be.ok;
        expect(model._attachments).to.be.ok;
        if (model._attachments) {
          expect(model._attachments.archive.data).to.be.ok;
          const bufferText = new Buffer(model._attachments.archive.data, 'base64');

          expect(model._attachments.archive).to.be.ok;
          expect(model._attachments.archive.content_type).to.be.ok;
          expect(model._attachments.archive.content_type).to.eq('text/plain');
          expect(bufferText.toString()).to.eq(fileData);
        }
      });

      it('should fail if the file archive is empty', async () => {
        let err: any = null;
        try {
          await serviceCache.create(packageName, {
            name: version,
            archive: null as any,
          });
        } catch (reason) {
          err = reason;
        }

        expect(err).to.be.ok;
        expect(err).to.contain('Failed to download file');
      });

      it('should fail if the file archive fails to download', async () => {
        const errMsg = 'An error occurred';
        const errPath = 'my-file-err';
        const archiveErr = `${url}/${errPath}`;

        nock(url)
          .get(`/${errPath}`)
          .replyWithError(errMsg);

        let err: any = null;
        try {
          await serviceCache.create(packageName, {
            name: version,
            archive: archiveErr,
          });
        } catch (reason) {
          err = reason;
        }

        expect(err).to.be.ok;
        expect(err).to.contain('Failed to download file');
      });

      xit('should fail if a package name is not provided', async () => {
        let err: string|undefined;

        try {
          await serviceCache.create(undefined as any, null as any);
        } catch (e) {
          err = e;
        }

        expect(err).to.eq('Please provide a package id');
      });

      xit('should fail if package version name is empty', async () => {
        let err: string|undefined;

        try {
          await serviceCache.create('', null as any);
        } catch (e) {
          err = e;
        }

        expect(err).to.eq('Please provide a valid version');
      });

      xit('should fail if package name is an empty string', () => {
        console.log('placeholder');
      });

      xit('should fail if a cache already exists', () => {
        console.log('placeholder');
      });
    });

    describe('get', () => {
      it('should run', () => {
        serviceCache.get('a', 'b');
      });

      xit('should return cache details if package and version have a match', () => {
        console.log('placeholder');
      });

      xit('should fail if package but version does not have a match', () => {
        console.log('placeholder');
      });

      xit('should fail if the package does not have a match', () => {
        console.log('placeholder');
      });

      xit('should be able to unzip and read the contents of an archive', () => {
        console.log('placeholder');
      });
    });

    describe('destroy', () => {
      it('should run', () => {
        serviceCache.destroy('a', 'b');
      });

      xit('should delete all package cache data if there is a match and no version', () => {
        console.log('placeholder');
      });

      xit('should delete the package version cache if there is a package and version match', () => {
        console.log('placeholder');
      });

      xit('should fail if there is no package match', () => {
        console.log('placeholder');
      });

      xit('should fail if there is no package and version match', () => {
        console.log('placeholder');
      });
    });
  });
});
