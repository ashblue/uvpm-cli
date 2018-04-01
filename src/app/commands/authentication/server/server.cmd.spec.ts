import * as chai from 'chai';
import { CmdServer } from './server.cmd';
import { ModelProfile } from '../../../models/profile/profile.model';
import { ServiceDatabase } from '../../../services/database/database.service';
import { ModelUvpmConfig } from '../../../models/uvpm/uvpm-config.model';
import { ServicePackageVersions } from '../../../services/package-versions/package-versions.service';
import { ServicePackages } from '../../../services/packages/packages.service';
import { A } from '../../../shared/tests/builder/a';

const expect = chai.expect;

describe('CmdServer', () => {
  let cmd: CmdServer;
  let db: ServiceDatabase;
  let profile: ModelProfile;
  let config: ModelUvpmConfig;
  let servicePackages: ServicePackages;
  let servicePackageVersions: ServicePackageVersions;

  beforeEach(async () => {
    db = new ServiceDatabase();
    profile = new ModelProfile(db);
    config = new ModelUvpmConfig();
    servicePackages = new ServicePackages(profile);
    servicePackageVersions = new ServicePackageVersions(profile);

    cmd = A.command()
      .withServiceDatabase(db)
      .withModelProfile(profile)
      .withModelUvpmConfig(config)
      .withServicePackages(servicePackages)
      .withServicePackageVersions(servicePackageVersions)
      .build(CmdServer);
  });

  it('should initialize', () => {
    expect(cmd).to.be.ok;
  });

  describe('when initialized', () => {
    describe('server', () => {
      it('should print the current server', async () => {
        const url = 'http://asdf.com';

        await cmd.action(url);
        await cmd.action();

        expect(cmd.log.lastEntry).to.contain(`Current server is "${url}"`);
      });

      it('should display an error if no server has been set', async () => {
        await cmd.action();

        expect(cmd.logError.lastEntry).to.contain('Please set a server');
      });
    });

    describe('server [url]', () => {
      it('should write to the user profile with the server"', async () => {
        const url = 'http://asdf.com';

        await cmd.action(url);
        await profile.load();

        expect(profile.server).to.eq(url);
        expect(cmd.log.lastEntry).to.contain(`Server set to "${url}"`);
      });

      it('should overwrite the previous url if run again', async () => {
        const url = 'http://asdf.com';
        const newUrl = 'http://fdsa.com';

        await cmd.action(url);
        await cmd.action(newUrl);
        await profile.load();

        expect(profile.server).to.eq(newUrl);
      });
    });
  });
});
