import { expect } from 'chai';
import { ServicePackages } from './packages.service';
import { IPackage } from '../../shared/interfaces/packages/i-package';
import { ModelProfile } from '../../models/profile/profile.model';
import { ServiceDatabase } from '../database/database.service';
import nock = require('nock');
import { async } from 'rxjs/scheduler/async';

describe('ServicePackage', () => {
  it('should initialize', () => {
    const packages = new ServicePackages(new ModelProfile(new ServiceDatabase()));

    expect(packages).to.be.ok;
  });

  describe('when initialized', () => {
    let packages: ServicePackages;
    let modelProfile: ModelProfile;
    let serviceDatabase: ServiceDatabase;

    beforeEach(() => {
      nock.cleanAll();
      serviceDatabase = new ServiceDatabase();
      modelProfile = new ModelProfile(serviceDatabase);

      packages = new ServicePackages(modelProfile);
    });

    xit('should have a reference to ServicePackageVersions');

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

        // Make sure nock was called at the assumed end point
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

      it('should fail if a server has not been set', async () => {
        const errMessage = 'Please set a server to run create';

        modelProfile.email = 'ash@blueashes.com';
        modelProfile.token = '12345';
        await modelProfile.save();

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

      it('should fail if a user has not logged in', async () => {
        const errMessage = 'You must be logged in to do that';

        modelProfile.server = 'http://uvpm.com';
        await modelProfile.save();

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
      xit('should retrieve the package by name');

      xit('should fail if a server has not been set');
    });

    describe('delete', () => {
      it('should delete the package by name');

      xit('should fail if a server has not been set');

      xit('should fail if the token has not been set');
    });
  });
});
