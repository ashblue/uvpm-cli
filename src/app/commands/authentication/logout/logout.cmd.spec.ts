import * as chai from 'chai';
import { Command } from 'commander';
import * as inquirer from 'inquirer';
import { ModelProfile } from '../../../models/profile/profile.model';
import { CmdLogout } from './logout.cmd';
import { ServiceDatabase } from '../../../services/database/database.service';

const expect = chai.expect;

describe('CmdWhoami', () => {
  it('should initialize', () => {
    const cmd = new CmdLogout(new ServiceDatabase(), new Command(), inquirer);
    expect(cmd).to.be.ok;
  });

  describe('when initialized', () => {
    let profile: ModelProfile;
    let cmd: CmdLogout;

    beforeEach(async () => {
      profile = new ModelProfile(new ServiceDatabase());
      cmd = new CmdLogout(new ServiceDatabase(), new Command(), inquirer);
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
});
