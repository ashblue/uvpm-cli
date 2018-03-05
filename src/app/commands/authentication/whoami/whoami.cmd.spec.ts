import * as chai from 'chai';
import { Command } from 'commander';
import * as inquirer from 'inquirer';
import { ModelProfile } from '../../../models/profile/profile.model';
import { CmdWhoami } from './whoami.cmd';
import { ServiceDatabase } from '../../../services/database/database.service';
import { ModelUvpmConfig } from '../../../models/uvpm/uvpm-config.model';
import { ServicePackageVersions } from '../../../services/package-versions/package-versions.service';
import { ServicePackages } from '../../../services/packages/packages.service';

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
    servicePackages = new ServicePackages(profile);
    servicePackageVersions = new ServicePackageVersions(profile);

    cmd = new CmdWhoami(db, profile, config, new Command(), inquirer, servicePackages, servicePackageVersions);
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

      expect(cmd.lastLog).to.contain(`Current user is: ${email}`);
    });

    it('should print to login if not logged in', async () => {
      await cmd.action();

      expect(cmd.lastLogErr).to.contain('You must run "uvpm login" to set a user');
    });
  });
});
