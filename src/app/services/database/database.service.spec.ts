import * as chai from 'chai';
import { ServiceDatabase } from './database.service';
import * as fs from 'fs';
import * as sinon from 'sinon';

const expect = chai.expect;

describe('ServiceDatabase', () => {
  let serviceDb: ServiceDatabase;

  beforeEach(() => {
    serviceDb = new ServiceDatabase();
  });

  it('should initialize', () => {
    expect(serviceDb).to.be.ok;
  });

  describe('onReady', () => {
    it('should resolve when both databases have been created', async () => {
      await serviceDb.onReady();
    });
  });

  describe('when ready', () => {
    beforeEach(async () => {
      await serviceDb.onReady();
    });

    it('should create a database folder at the root of the project', () => {
      expect(fs.existsSync(ServiceDatabase.databasePath)).to.be.ok;
    });

    describe('profile', () => {
      it('should populate a cache field with a database', () => {
        expect(serviceDb.profile).to.be.ok;
      });

      it('should create a cache folder in the database folder', () => {
        expect(fs.existsSync(ServiceDatabase.profilePath)).to.be.ok;
      });
    });

    describe('cache', () => {
      it('should populate a cache field with a database', () => {
        expect(serviceDb.cache).to.be.ok;
      });

      it('should create a cache folder in the database folder', () => {
        expect(fs.existsSync(ServiceDatabase.cachePath)).to.be.ok;
      });
    });

    describe('destroy', () => {
      it('should delete the database folder', async () => {
        serviceDb = new ServiceDatabase();

        await serviceDb.destroy();

        expect(fs.existsSync(ServiceDatabase.databasePath)).to.not.be.ok;
      });

      it('should gracefully fail if destroy returns an error', async () => {
        serviceDb = new ServiceDatabase();
        const errMsg = 'Error occurred';
        const stub = sinon.stub(serviceDb.profile, 'destroy');
        stub.callsFake(() => {
          // @ts-ignore
          return new Promise((resolve, reject) => {
            reject(errMsg);
          });
        });

        let e: any;
        try {
          await serviceDb.destroy();
        } catch (response) {
          e = response;
        }

        expect(e).to.eq(errMsg);
      });
    });
  });
});
