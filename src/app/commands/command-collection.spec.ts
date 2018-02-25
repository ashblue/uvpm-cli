import { CommandCollection } from './command-collection';
import * as chai from 'chai';
import * as commander from 'commander';
import * as inquirer from 'inquirer';
import { ServiceDatabase } from '../services/database/database.service';
import { ModelProfile } from '../models/profile/profile.model';

const expect = chai.expect;

describe('CommandCollection', () => {
  let db: ServiceDatabase;
  let profile: ModelProfile;

  beforeEach(async () => {
    db = new ServiceDatabase();
    profile = new ModelProfile(db);
  });

  it('should initialize', () => {
    const col = new CommandCollection(db, profile, new commander.Command(), inquirer);

    expect(col).to.be.ok;
  });

  describe('when initialized', () => {
    let col: CommandCollection;

    beforeEach(() => {
      col = new CommandCollection(db, profile, new commander.Command(), inquirer);
    });

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
