import { expect } from 'chai';
import { ServicePackages } from './packages.service';
import { IPackage } from '../../shared/interfaces/packages/i-package';
import { ModelProfile } from '../../models/profile/profile.model';
import { ServiceDatabase } from '../database/database.service';
import nock = require('nock');
import { IPackageSearchResult } from '../../shared/interfaces/packages/i-package-search-result';

describe('ServicePackage', () => {
  it('should initialize', () => {
    const packages = new ServicePackages(new ModelProfile(new ServiceDatabase()));

    expect(packages).to.be.ok;
  });

  describe('when initialized', () => {
    const server = 'http://uvpm.com';
    const packageName = 'my-package';

    let packages: ServicePackages;
    let modelProfile: ModelProfile;
    let serviceDatabase: ServiceDatabase;

    beforeEach(() => {
      nock.cleanAll();
      serviceDatabase = new ServiceDatabase();
      modelProfile = new ModelProfile(serviceDatabase);

      packages = new ServicePackages(modelProfile);
    });

    describe('create', () => {
      const packageData: IPackage = {
        name: 'my-package',
        versions: [
          {
            name: '1.0.0',
            archive: 'Content here',
          },
        ],
      };

      it('should create a new package with the corresponding version', async () => {
        modelProfile.server = 'http://uvpm.com';
        modelProfile.email = 'ash@blueashes.com';
        modelProfile.token = '12345';
        await modelProfile.save();

        nock(modelProfile.server)
          .post('/api/v1/packages')
          .reply(200, packageData);

        const result = await packages.create(packageData);

        expect(result).to.be.ok;
        expect(result.name).to.eq(packageData.name);
        expect(result.versions[0].name).to.eq(packageData.versions[0].name);
        expect(result.versions[0].archive).to.eq(packageData.versions[0].archive);
      });

      it('should fail if the server returns an error code', async () => {
        const errMessage = 'Failed to create package';

        modelProfile.server = 'http://uvpm.com';
        modelProfile.email = 'ash@blueashes.com';
        modelProfile.token = '12345';
        await modelProfile.save();

        nock(modelProfile.server)
          .post('/api/v1/packages')
          .reply(500, errMessage);

        let err: any = null;
        try {
          await packages.create(packageData);
        } catch (e) {
          err = e;
        }

        // Make sure nock was called at the assumed end point
        expect(err).to.be.ok;
        expect(err).to.eq(errMessage);
      });

      it('should fail if a non code based error triggers', async () => {
        const errMessage = 'Something went wrong';

        modelProfile.server = 'http://uvpm.com';
        modelProfile.email = 'ash@blueashes.com';
        modelProfile.token = '12345';
        await modelProfile.save();

        nock(modelProfile.server)
          .post('/api/v1/packages')
          .replyWithError(errMessage);

        let err: any = null;
        try {
          await packages.create(packageData);
        } catch (e) {
          err = e;
        }

        // Make sure nock was called at the assumed end point
        expect(err).to.be.ok;
        expect(err.toString()).to.contain(errMessage);
      });

      it('should fail if a header token is not provided', async () => {
        const successMessage = 'Success';

        modelProfile.server = 'http://uvpm.com';
        modelProfile.email = 'ash@blueashes.com';
        modelProfile.token = '12345';
        await modelProfile.save();

        nock(modelProfile.server)
          .matchHeader('Authorization', `Bearer ${modelProfile.token}`)
          .post('/api/v1/packages')
          .reply(200, 'Success');

        const result = await packages.create(packageData);

        // Make sure nock was called at the assumed end point
        expect(result).to.be.ok;
        expect(result).to.eq(successMessage);
      });
    });

    describe('get', () => {
      const packageExample: IPackage = {
        name: packageName,
        author: {
          name: 'Ash Blue',
          email: 'ash@blueashes.com',
        },
        versions: [
          {
            name: '1.0.0',
            archive: 'http://uvpm.com',
          },
        ],
      };

      it('should retrieve the package by name', async () => {
        modelProfile.server = server;
        await modelProfile.save();

        nock(server)
          .get(`/api/v1/packages/${packageName}`)
          .reply(200, packageExample);

        const result = await packages.get(packageName);

        expect(result).to.be.ok;
        expect(result.name).to.eq(packageExample.name);
        expect(result.versions[0].name).to.eq(packageExample.versions[0].name);
        expect(result.versions[0].archive).to.eq(packageExample.versions[0].archive);
      });

      it('should fail if the server returns an error code', async () => {
        const errMessage = 'Failed to get a package';

        modelProfile.server = 'http://uvpm.com';
        await modelProfile.save();

        nock(server)
          .get(`/api/v1/packages/${packageName}`)
          .reply(500, errMessage);

        let err: any = null;
        try {
          await packages.get(packageName);
        } catch (e) {
          err = e;
        }

        // Make sure nock was called at the assumed end point
        expect(err).to.be.ok;
        expect(err).to.eq(errMessage);
      });

      it('should fail if a non code based error triggers', async () => {
        const errMessage = 'Failed to get a package';

        modelProfile.server = 'http://uvpm.com';
        await modelProfile.save();

        nock(server)
          .get(`/api/v1/packages/${packageName}`)
          .replyWithError(errMessage);

        let err: any = null;
        try {
          await packages.get(packageName);
        } catch (e) {
          err = e;
        }

        // Make sure nock was called at the assumed end point
        expect(err).to.be.ok;
        expect(err.toString()).to.contain(errMessage);
      });

      it('should pass in an authorization token if logged in', async () => {
        const successMessage = 'Success';

        modelProfile.server = 'http://uvpm.com';
        modelProfile.email = 'ash@blueashes.com';
        modelProfile.token = '12345';
        await modelProfile.save();

        nock(modelProfile.server)
          .matchHeader('Authorization', `Bearer ${modelProfile.token}`)
          .get(`/api/v1/packages/${packageName}`)
          .reply(200, 'Success');

        const result = await packages.get(packageName);

        // Make sure nock was called at the assumed end point
        expect(result).to.be.ok;
        expect(result).to.eq(successMessage);
      });

      it('should skip the authorization header token if logged out', async () => {
        const successMessage = 'Success';

        modelProfile.server = 'http://uvpm.com';
        await modelProfile.save();

        let authHeader: any = null;
        const n = nock(modelProfile.server)
          .get(`/api/v1/packages/${packageName}`)
          .reply(200, successMessage);

        n.on('request', (req) => {
          authHeader = req.headers.authorization;
        });

        const result = await packages.get(packageName);

        expect(result).to.be.ok;
        expect(result).to.eq(successMessage);
        expect(authHeader).to.not.eq(null);
        expect(authHeader).to.not.be.ok;
      });
    });

    describe('delete', () => {
      it('should delete the package by name', async () => {
        modelProfile.server = server;
        modelProfile.email = 'ash@blueashes.com';
        modelProfile.token = '12345';
        await modelProfile.save();

        nock(modelProfile.server)
          .delete(`/api/v1/packages/${packageName}`)
          .reply(200);

        const result = await packages.delete(packageName);

        // Make sure nock was called at the assumed end point
        expect(result).to.not.be.ok;
      });

      it('should fail if the server returns an error code', async () => {
        const errMsg = 'Not found';

        modelProfile.server = server;
        modelProfile.email = 'ash@blueashes.com';
        modelProfile.token = '12345';
        await modelProfile.save();

        nock(modelProfile.server)
          .delete(`/api/v1/packages/${packageName}`)
          .reply(404, errMsg);

        let err: any = null;
        try {
          await packages.delete(packageName);
        } catch (e) {
          err = e;
        }

        // Make sure nock was called at the assumed end point
        expect(err).to.be.ok;
        expect(err).to.contain(errMsg);
      });

      it('should fail if a non code based error triggers', async () => {
        const errMsg = 'Unkown error';

        modelProfile.server = server;
        modelProfile.email = 'ash@blueashes.com';
        modelProfile.token = '12345';
        await modelProfile.save();

        nock(modelProfile.server)
          .delete(`/api/v1/packages/${packageName}`)
          .replyWithError(errMsg);

        let err: any = null;
        try {
          await packages.delete(packageName);
        } catch (e) {
          err = e;
        }

        // Make sure nock was called at the assumed end point
        expect(err).to.be.ok;
        expect(err.toString()).to.contain(errMsg);
      });

      it('should fail if a header token is not provided', async () => {
        modelProfile.server = 'http://uvpm.com';
        modelProfile.email = 'ash@blueashes.com';
        modelProfile.token = '12345';
        await modelProfile.save();

        nock(modelProfile.server)
          .matchHeader('Authorization', `Bearer ${modelProfile.token}`)
          .delete(`/api/v1/packages/${packageName}`)
          .reply(200);

        const result = await packages.delete(packageName);

        // Make sure nock was called at the assumed end point
        expect(result).to.not.be.ok;
      });
    });

    describe('search', () => {
      it('should return a promise with the search results by name', async () => {
        const searchResult: IPackageSearchResult = {
          name: packageName,
          description: 'Once upon a time',
          author: 'Ash Blue',
          date: Date.now(),
          version: '1.0.0',
        };

        modelProfile.server = server;
        await modelProfile.save();

        nock(server)
          .get(`/api/v1/packages/search/${packageName}`)
          .reply(200, searchResult);

        const result = await packages.search(packageName);

        expect(result).to.deep.eq(searchResult);
      });

      it('should fail if a non code based error triggers', async () => {
        const errMsg = 'Unknown error';

        modelProfile.server = server;
        await modelProfile.save();

        nock(modelProfile.server)
          .get(`/api/v1/packages/search/${packageName}`)
          .replyWithError(errMsg);

        let err: any = null;
        try {
          await packages.search(packageName);
        } catch (e) {
          err = e;
        }

        expect(err.toString()).to.contain(errMsg);
      });

      it('should fail if the server returns an error code', async () => {
        const errMsg = 'Not found';

        modelProfile.server = server;
        await modelProfile.save();

        nock(server)
          .get(`/api/v1/packages/search/${packageName}`)
          .reply(404, errMsg);

        let err: any = null;
        try {
          await packages.search(packageName);
        } catch (e) {
          err = e;
        }

        expect(err).to.contain(errMsg);
      });
    });
  });
});
