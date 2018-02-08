import * as chai from 'chai';
import { Command } from 'commander';
import * as inquirer from 'inquirer';
import { ModelProfile } from '../../../shared/models/profile/profile.model';
import { CmdWhoami } from './whoami.cmd';

const expect = chai.expect;

describe('CmdWhoami', () => {
  it('should initialize', () => {
    const cmd = new CmdWhoami(new Command(), inquirer);
    expect(cmd).to.be.ok;
  });

  describe('when initialized', () => {
    let profile: ModelProfile;
    let cmd: CmdWhoami;

    beforeEach(async () => {
      profile = new ModelProfile();
      await profile.clear();

      cmd = new CmdWhoami(new Command(), inquirer);
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
});
