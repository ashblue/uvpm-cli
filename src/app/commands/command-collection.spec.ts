import { CommandCollection } from './command-collection';
import * as chai from 'chai';
import * as commander from 'commander';
import * as inquirer from 'inquirer';
import { ServiceDatabase } from '../services/database/database.service';
import { ModelProfile } from '../models/profile/profile.model';
import { ModelUvpmConfig } from '../models/uvpm/uvpm-config.model';
import { ServicePackageVersions } from '../services/package-versions/package-versions.service';
import { ServicePackages } from '../services/packages/packages.service';

const expect = chai.expect;

describe('CommandCollection', () => {
  let db: ServiceDatabase;
  let profile: ModelProfile;
  let config: ModelUvpmConfig;

  let col: CommandCollection;
  let servicePackages: ServicePackages;
  let servicePackageVersions: ServicePackageVersions;

  beforeEach(async () => {
    db = new ServiceDatabase();
    profile = new ModelProfile(db);
    config = new ModelUvpmConfig();
    servicePackages = new ServicePackages(profile);
    servicePackageVersions = new ServicePackageVersions(profile);

    col = new CommandCollection(db, profile, config, new commander.Command(), inquirer,
      servicePackages, servicePackageVersions);
  });

  it('should initialize', () => {
    expect(col).to.be.ok;
  });

  describe('when initialized', () => {
    describe('generators', () => {
      it('should inject an init command', () => {
        const match = col.commandInstances.find((i) => {
          return i.name.toLowerCase().includes('init');
        });

        expect(match).to.be.ok;
      });
    });

    describe('publishing', () => {
      it('should inject a version command', () => {
        const match = col.commandInstances.find((i) => {
          return i.name.toLowerCase().includes('version');
        });

        expect(match).to.be.ok;
      });
    });

    describe('authentication', () => {
      it('should inject a login command', () => {
        const match = col.commandInstances.find((i) => {
          return i.name.toLowerCase().includes('login');
        });

        expect(match).to.be.ok;
      });

      it('should inject a logout command', () => {
        const match = col.commandInstances.find((i) => {
          return i.name.toLowerCase().includes('logout');
        });

        expect(match).to.be.ok;
      });

      it('should inject a whoami command', () => {
        const match = col.commandInstances.find((i) => {
          return i.name.toLowerCase().includes('whoami');
        });

        expect(match).to.be.ok;
      });

      it('should inject a server command', () => {
        const match = col.commandInstances.find((i) => {
          return i.name.toLowerCase().includes('server');
        });

        expect(match).to.be.ok;
      });
    });
  });
});
