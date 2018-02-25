import * as chai from 'chai';
import { Command } from 'commander';
import * as inquirer from 'inquirer';
import { ModelProfile } from '../../../models/profile/profile.model';
import { CmdLogout } from './logout.cmd';
import { ServiceDatabase } from '../../../services/database/database.service';

const expect = chai.expect;

describe('CmdLogout', () => {
  let db: ServiceDatabase;
  let profile: ModelProfile;
  let cmd: CmdLogout;

  beforeEach(async () => {
    db = new ServiceDatabase();
    profile = new ModelProfile(db);
    cmd = new CmdLogout(db, profile, new Command(), inquirer);
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

      expect(cmd.lastLog).to.contain('Logged out');
    });

    it('should print success if the user isn\'t logged in', async () => {
      await cmd.action();

      expect(cmd.lastLog).to.contain('Logged out');
    });
  });
});
