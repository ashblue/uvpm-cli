import * as chai from 'chai';
import { ServiceDatabase } from './database.service';
import * as fs from 'fs';

const expect = chai.expect;

describe('ServiceDatabase', () => {
  it('should initialize', () => {
    const serviceDb = new ServiceDatabase();

    expect(serviceDb).to.be.ok;
    expect(serviceDb.profile).to.be.ok;
    expect(serviceDb.packageVersionCache).to.be.ok;
    expect(ServiceDatabase.profilePath).to.be.ok;
    expect(ServiceDatabase.cachePath).to.be.ok;
  });

  it('should create a database folder at the root of the project', () => {
    const serviceDb = new ServiceDatabase();

    expect(serviceDb).to.be.ok;
    expect(fs.existsSync(ServiceDatabase.databasePath)).to.be.ok;
    expect(fs.existsSync(ServiceDatabase.profilePath)).to.be.ok;
    expect(fs.existsSync(ServiceDatabase.cachePath)).to.be.ok;
  });

  it('should delete the database folder', async () => {
    const serviceDb = new ServiceDatabase();

    await serviceDb.destroy();

    expect(fs.existsSync(ServiceDatabase.databasePath)).to.not.be.ok;
    expect(fs.existsSync(ServiceDatabase.profilePath)).to.not.be.ok;
    expect(fs.existsSync(ServiceDatabase.cachePath)).to.not.be.ok;
  });
});
