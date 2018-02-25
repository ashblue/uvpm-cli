import { ServicePackageVersions } from './package-versions.service';
import { ModelProfile } from '../../models/profile/profile.model';
import { ServiceDatabase } from '../database/database.service';
import { expect } from 'chai';
import nock = require('nock');
import { IPackageVersion } from '../../shared/interfaces/packages/versions/i-package-version';

describe('ServicePackageVersions', () => {
  const server = 'http://uvpm.com';
  const packageName = 'my-package';

  const versionExample: IPackageVersion = {
    name: '1.0.0',
    archive: 'My custom content',
  };

  let service: ServicePackageVersions;
  let modelProfile: ModelProfile;
  let serviceDatabase: ServiceDatabase;

  beforeEach(() => {
    nock.cleanAll();

    serviceDatabase = new ServiceDatabase();
    modelProfile = new ModelProfile(serviceDatabase);
    service = new ServicePackageVersions(modelProfile);
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
    xit('should delete the package version');
  });
});
