import { ServicePackageVersions } from './package-versions.service';
import { ModelProfile } from '../../models/profile/profile.model';
import { ServiceDatabase } from '../database/database.service';
import { expect } from 'chai';
import nock = require('nock');
import { IPackageVersion } from '../../shared/interfaces/packages/versions/i-package-version';
import * as tmp from 'tmp';
import * as sinon from 'sinon';
import { SynchrounousResult } from 'tmp';
import { SinonStub } from 'sinon';

describe('ServicePackageVersions', () => {
  const server = 'http://uvpm.com';
  const packageName = 'my-package';
  let versionExample: IPackageVersion;

  let service: ServicePackageVersions;
  let modelProfile: ModelProfile;
  let serviceDatabase: ServiceDatabase;

  beforeEach(() => {
    nock.cleanAll();

    serviceDatabase = new ServiceDatabase();
    modelProfile = new ModelProfile(serviceDatabase);
    service = new ServicePackageVersions(modelProfile);

    versionExample = {
      name: '1.0.0',
      archive: `${server}/${packageName}/archive.gz.tar`,
    };
  });

  it('should initialize', () => {
    expect(service).to.be.ok;
  });

  describe('add', () => {
    it('should create a new version', async () => {
      modelProfile.server = server;
      modelProfile.email = 'ash@blueashes.com';
      modelProfile.token = '12345';
      await modelProfile.save();

      nock(modelProfile.server)
        .post(`/api/v1/packages/${packageName}/versions`)
        .reply(200, versionExample);

      const result = await service.add(packageName, versionExample);

      expect(result).to.be.ok;
      expect(result.name).to.eq(versionExample.name);
      expect(result.archive).to.eq(versionExample.archive);
    });

    it('should fail if the server returns an error code', async () => {
      const errMsg = 'Internal server error';

      modelProfile.server = server;
      modelProfile.email = 'ash@blueashes.com';
      modelProfile.token = '12345';
      await modelProfile.save();

      nock(modelProfile.server)
        .post(`/api/v1/packages/${packageName}/versions`)
        .reply(500, errMsg);

      let err: any = null;
      try {
        await service.add(packageName, versionExample);
      } catch (e) {
        err = e;
      }

      expect(err).to.be.ok;
      expect(err).to.eq(errMsg);
    });

    it('should fail if a non code based error triggers', async () => {
      const errMsg = 'Request error';

      modelProfile.server = server;
      modelProfile.email = 'ash@blueashes.com';
      modelProfile.token = '12345';
      await modelProfile.save();

      nock(modelProfile.server)
        .post(`/api/v1/packages/${packageName}/versions`)
        .replyWithError(errMsg);

      let err: any = null;
      try {
        await service.add(packageName, versionExample);
      } catch (e) {
        err = e;
      }

      expect(err).to.be.ok;
      expect(err.toString()).to.contain(errMsg);
    });

    it('should fail if a header token is not provided', async () => {
      modelProfile.server = server;
      modelProfile.email = 'ash@blueashes.com';
      modelProfile.token = '12345';
      await modelProfile.save();

      nock(modelProfile.server)
        .matchHeader('Authorization', `Bearer ${modelProfile.token}`)
        .post(`/api/v1/packages/${packageName}/versions`)
        .reply(200, versionExample);

      const result = await service.add(packageName, versionExample);

      expect(result).to.be.ok;
      expect(result.name).to.eq(versionExample.name);
      expect(result.archive).to.eq(versionExample.archive);
    });
  });

  describe('get', () => {
    it('should return the version', async () => {
      modelProfile.server = server;
      modelProfile.email = 'ash@blueashes.com';
      modelProfile.token = '12345';
      await modelProfile.save();

      nock(modelProfile.server)
        .get(`/api/v1/packages/${packageName}/versions/${versionExample.name}`)
        .reply(200, versionExample);

      const result = await service.get(packageName, versionExample.name);

      expect(result).to.be.ok;
      expect(result.name).to.eq(versionExample.name);
      expect(result.archive).to.eq(versionExample.archive);
    });

    it('should fail if the server returns an error code', async () => {
      const errMsg = 'Internal server error';

      modelProfile.server = server;
      modelProfile.email = 'ash@blueashes.com';
      modelProfile.token = '12345';
      await modelProfile.save();

      nock(modelProfile.server)
        .get(`/api/v1/packages/${packageName}/versions/${versionExample.name}`)
        .reply(500, errMsg);

      let err: any = null;
      try {
        await service.get(packageName, versionExample.name);
      } catch (e) {
        err = e;
      }

      expect(err).to.be.ok;
      expect(err).to.eq(errMsg);
    });

    it('should fail if a non code based error triggers', async () => {
      const errMsg = 'Unknown error';

      modelProfile.server = server;
      modelProfile.email = 'ash@blueashes.com';
      modelProfile.token = '12345';
      await modelProfile.save();

      nock(modelProfile.server)
        .get(`/api/v1/packages/${packageName}/versions/${versionExample.name}`)
        .replyWithError(errMsg);

      let err: any = null;
      try {
        await service.get(packageName, versionExample.name);
      } catch (e) {
        err = e;
      }

      expect(err).to.be.ok;
      expect(err.toString()).to.contain(errMsg);
    });

    it('should pass in an authorization token if logged in', async () => {
      modelProfile.server = server;
      modelProfile.email = 'ash@blueashes.com';
      modelProfile.token = '12345';
      await modelProfile.save();

      nock(modelProfile.server)
        .matchHeader('Authorization', `Bearer ${modelProfile.token}`)
        .get(`/api/v1/packages/${packageName}/versions/${versionExample.name}`)
        .reply(200, versionExample);

      const result = await service.get(packageName, versionExample.name);

      expect(result).to.be.ok;
      expect(result.name).to.eq(versionExample.name);
      expect(result.archive).to.eq(versionExample.archive);
    });

    it('should skip the authorization header token if logged out', async () => {
      const successMessage = 'Success';

      modelProfile.server = server;
      await modelProfile.save();

      const n = nock(modelProfile.server)
        .get(`/api/v1/packages/${packageName}/versions/${versionExample.name}`)
        .reply(200, successMessage);

      let authHeader: any = null;
      n.on('request', (req) => {
        authHeader = req.headers.authorization;
      });

      const result = await service.get(packageName, versionExample.name);

      expect(result).to.be.ok;
      expect(result).to.eq(successMessage);
      expect(authHeader).to.not.eq(null);
      expect(authHeader).to.not.be.ok;
    });
  });

  describe('delete', () => {
    it('should delete the package version', async () => {
      modelProfile.server = server;
      modelProfile.email = 'ash@blueashes.com';
      modelProfile.token = '12345';
      await modelProfile.save();

      nock(modelProfile.server)
        .delete(`/api/v1/packages/${packageName}/versions/${versionExample.name}`)
        .reply(200, versionExample);

      const result = await service.delete(packageName, versionExample.name);

      expect(result).to.not.be.ok;
    });

    it('should fail if the server returns an error code', async () => {
      const errMsg = 'Internal server error';

      modelProfile.server = server;
      modelProfile.email = 'ash@blueashes.com';
      modelProfile.token = '12345';
      await modelProfile.save();

      nock(modelProfile.server)
        .delete(`/api/v1/packages/${packageName}/versions/${versionExample.name}`)
        .reply(500, errMsg);

      let err: any = null;
      try {
        await service.delete(packageName, versionExample.name);
      } catch (e) {
        err = e;
      }

      expect(err).to.be.ok;
      expect(err).to.eq(errMsg);
    });

    it('should fail if a non code based error triggers', async () => {
      const errMsg = 'Internal server error';

      modelProfile.server = server;
      modelProfile.email = 'ash@blueashes.com';
      modelProfile.token = '12345';
      await modelProfile.save();

      nock(modelProfile.server)
        .delete(`/api/v1/packages/${packageName}/versions/${versionExample.name}`)
        .replyWithError(errMsg);

      let err: any = null;
      try {
        await service.delete(packageName, versionExample.name);
      } catch (e) {
        err = e;
      }

      expect(err).to.be.ok;
      expect(err.toString()).to.contain(errMsg);
    });

    it('should fail if a header token is not provided', async () => {
      modelProfile.server = server;
      modelProfile.email = 'ash@blueashes.com';
      modelProfile.token = '12345';
      await modelProfile.save();

      nock(modelProfile.server)
        .matchHeader('Authorization', `Bearer ${modelProfile.token}`)
        .delete(`/api/v1/packages/${packageName}/versions/${versionExample.name}`)
        .reply(200, versionExample);

      const result = await service.delete(packageName, versionExample.name);

      expect(result).to.not.be.ok;
    });
  });

  describe('downloadArchive', () => {
    let tmpFile: SynchrounousResult;
    let tmpFileServer: SynchrounousResult;
    let stubTmpFileSync: SinonStub;

    beforeEach(() => {
      tmpFile = tmp.fileSync();
      tmpFileServer = tmp.fileSync();
      stubTmpFileSync = sinon.stub(tmp, 'fileSync')
        .callsFake(() => {
          return tmpFile;
        });
    });

    afterEach(() => {
      if (stubTmpFileSync) {
        stubTmpFileSync.restore();
      }
    });

    it('should return a downloaded archive local tmp file path', async () => {
      modelProfile.server = server;
      nock(modelProfile.server)
        .get(`/api/v1/packages/${packageName}/versions/${versionExample.name}`)
        .reply(200, versionExample);

      nock(modelProfile.server)
        .get(`/${packageName}/archive.gz.tar`)
        .replyWithFile(200, tmpFileServer.name);

      const downloadPath = await service.downloadArchive(packageName, '1.0.0');

      expect(downloadPath).to.eq(tmpFile.name);
    });

    describe('failure', () => {
      it('should error if the get call fails', async () => {
        const serverErrMsg = 'Failed to download';

        modelProfile.server = server;
        nock(modelProfile.server)
          .get(`/api/v1/packages/${packageName}/versions/${versionExample.name}`)
          .reply(500, serverErrMsg);

        let errMsg: string = '';
        try {
          await service.downloadArchive(packageName, '1.0.0');
        } catch (err) {
          errMsg = err;
        }

        expect(errMsg).to.eq(serverErrMsg);
      });

      it('should error if the http call to the file fails', async () => {
        const serverErrMsg = 'Failed to download';

        modelProfile.server = server;
        nock(modelProfile.server)
          .get(`/api/v1/packages/${packageName}/versions/${versionExample.name}`)
          .reply(200, versionExample);

        nock(modelProfile.server)
          .get(`/${packageName}/archive.gz.tar`)
          .replyWithError(serverErrMsg);

        let errMsg: string = '';
        try {
          await service.downloadArchive(packageName, '1.0.0');
        } catch (err) {
          errMsg = err;
        }

        expect(errMsg.toString()).to.eq(`Error: ${serverErrMsg}`);
      });

      it('should error if the requested version does not exist', async () => {
        const serverErrMsg = 'No match for request';

        modelProfile.server = server;
        nock(modelProfile.server)
          .get(`/api/v1/packages/${packageName}/versions/${versionExample.name}`)
          .reply(200, versionExample);

        nock(modelProfile.server)
          .get(`/${packageName}/archive.gz.tar`)
          .replyWithFile(200, tmpFileServer.name);

        let errMsg: string = '';
        try {
          await service.downloadArchive(packageName, '2.0.0');
        } catch (err) {
          errMsg = err;
        }

        expect(errMsg.toString()).to.contain(serverErrMsg);
      });
    });
  });
});
