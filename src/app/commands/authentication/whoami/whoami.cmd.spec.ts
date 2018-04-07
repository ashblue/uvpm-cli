import * as chai from 'chai';
import { ModelProfile } from '../../../models/profile/profile.model';
import { CmdWhoami } from './whoami.cmd';
import { ServiceDatabase } from '../../../services/database/database.service';
import { ModelUvpmConfig } from '../../../models/uvpm/uvpm-config.model';
import { ServicePackageVersions } from '../../../services/package-versions/package-versions.service';
import { ServicePackages } from '../../../services/packages/packages.service';
import { A } from '../../../shared/tests/builder/a';
import { ServiceAxios } from '../../../services/axios/axios.service';

const expect = chai.expect;

describe('CmdWhoami', () => {
  let db: ServiceDatabase;
  let profile: ModelProfile;
  let config: ModelUvpmConfig;
  let cmd: CmdWhoami;
  let servicePackages: ServicePackages;
  let servicePackageVersions: ServicePackageVersions;

  beforeEach(async () => {
    db = new ServiceDatabase();
    profile = new ModelProfile(db);
    config = new ModelUvpmConfig();

    const serviceAxis = new ServiceAxios(profile);
    servicePackages = new ServicePackages(profile, serviceAxis);
    servicePackageVersions = new ServicePackageVersions(profile, serviceAxis);

    cmd = A.command()
      .withServiceDatabase(db)
      .withModelProfile(profile)
      .withModelUvpmConfig(config)
      .withServicePackages(servicePackages)
      .withServicePackageVersions(servicePackageVersions)
      .build(CmdWhoami);
  });

  it('should initialize', () => {
    expect(cmd).to.be.ok;
  });

  describe('whoami', () => {
    it('should print the current user if logged in', async () => {
      const email = 'asdf@asdf.com';
      const token = '1234jk@#$2k4jsdf';

      profile.email = email;
      profile.token = token;
      await profile.save();
      expect(profile.isLoggedIn).to.be.ok;

      await cmd.action();

      expect(cmd.log.lastEntry).to.contain(`Current user is: ${email}`);
    });

    it('should print to login if not logged in', async () => {
      await cmd.action();

      expect(cmd.logError.lastEntry).to.contain('You must run "uvpm login" to set a user');
    });
  });
});
