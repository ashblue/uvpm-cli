import * as chai from 'chai';
import { ModelProfile } from '../../../models/profile/profile.model';
import { CmdLogout } from './logout.cmd';
import { ServiceDatabase } from '../../../services/database/database.service';
import { ModelUvpmConfig } from '../../../models/uvpm/uvpm-config.model';
import { ServicePackageVersions } from '../../../services/package-versions/package-versions.service';
import { ServicePackages } from '../../../services/packages/packages.service';
import { A } from '../../../shared/tests/builder/a';
import { ServiceAxios } from '../../../services/axios/axios.service';

const expect = chai.expect;

describe('CmdLogout', () => {
  let db: ServiceDatabase;
  let profile: ModelProfile;
  let cmd: CmdLogout;
  let config: ModelUvpmConfig;
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
      .build(CmdLogout);
  });

  it('should initialize', () => {
    expect(cmd).to.be.ok;
  });

  describe('logout', () => {
    it('should remove the users login credentials when logged in', async () => {
      const email = 'asdf@asdf.com';
      const token = '1234jk@#$2k4jsdf';

      profile.email = email;
      profile.token = token;
      await profile.save();
      expect(profile.isLoggedIn).to.be.ok;

      await cmd.action();
      await profile.load();

      expect(profile.isLoggedIn).to.not.be.ok;
      expect(profile.email).to.not.be.ok;
      expect(profile.token).to.not.be.ok;

      expect(cmd.log.lastEntry).to.contain('Logged out');
    });

    it('should print success if the user isn\'t logged in', async () => {
      await cmd.action();

      expect(cmd.log.lastEntry).to.contain('Logged out');
    });
  });
});
