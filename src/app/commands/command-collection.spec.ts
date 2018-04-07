import { CommandCollection } from './command-collection';
import * as chai from 'chai';
import * as commander from 'commander';
import * as inquirer from 'inquirer';
import { ServiceDatabase } from '../services/database/database.service';
import { ModelProfile } from '../models/profile/profile.model';
import { ModelUvpmConfig } from '../models/uvpm/uvpm-config.model';
import { ServicePackageVersions } from '../services/package-versions/package-versions.service';
import { ServicePackages } from '../services/packages/packages.service';
import { ServiceCache } from '../services/cache/cache.service';
import { ServiceAxios } from '../services/axios/axios.service';
import { ServiceAuthentication } from '../services/authentication/authentication.service';

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

    const serviceAxios = new ServiceAxios(profile);
    servicePackages = new ServicePackages(profile, serviceAxios);
    servicePackageVersions = new ServicePackageVersions(profile, serviceAxios);

    col = new CommandCollection(db, profile, config, new commander.Command(), inquirer,
      servicePackages, servicePackageVersions, new ServiceCache(db), new ServiceAuthentication(profile, serviceAxios));
  });

  it('should initialize', () => {
    expect(col).to.be.ok;
  });

  function findCommand (commandName: string) {
    const match = col.commandInstances.find((i) => {
      return i.name.toLowerCase().includes(commandName);
    });

    return match;
  }

  describe('when initialized', () => {
    describe('dependencies', () => {
      it('should inject the install command', () => {
        const match = findCommand('install');

        expect(match).to.be.ok;
      });

      it('should inject the install command', () => {
        const match = findCommand('uninstall');

        expect(match).to.be.ok;
      });

      it('should inject the cache-clear command', () => {
        const match = findCommand('cache-clear');

        expect(match).to.be.ok;
      });

      it('should inject the search command', () => {
        const match = findCommand('search');

        expect(match).to.be.ok;
      });

      it('should inject the view command', () => {
        const match = findCommand('view');

        expect(match).to.be.ok;
      });
    });

    describe('generators', () => {
      it('should inject an init command', () => {
        const match = findCommand('init');

        expect(match).to.be.ok;
      });
    });

    describe('publishing', () => {
      it('should inject a version command', () => {
        const match = findCommand('version');

        expect(match).to.be.ok;
      });

      it('should inject a publish command', () => {
        const match = findCommand('publish');

        expect(match).to.be.ok;
      });

      it('should inject an unpublish command', () => {
        const match = findCommand('unpublish');

        expect(match).to.be.ok;
      });
    });

    describe('authentication', () => {
      it('should inject a login command', () => {
        const match = findCommand('login');

        expect(match).to.be.ok;
      });

      it('should inject a logout command', () => {
        const match = findCommand('logout');

        expect(match).to.be.ok;
      });

      it('should inject a whoami command', () => {
        const match = findCommand('whoami');

        expect(match).to.be.ok;
      });

      it('should inject a server command', () => {
        const match = findCommand('server');

        expect(match).to.be.ok;
      });

      it('should inject a register command', () => {
        const match = findCommand('register');

        expect(match).to.be.ok;
      });
    });
  });
});
