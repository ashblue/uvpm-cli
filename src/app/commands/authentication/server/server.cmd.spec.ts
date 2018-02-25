import * as chai from 'chai';
import { Command } from 'commander';
import { CmdServer } from './server.cmd';
import * as inquirer from 'inquirer';
import { ModelProfile } from '../../../models/profile/profile.model';
import { ServiceDatabase } from '../../../services/database/database.service';

const expect = chai.expect;

describe('CmdServer', () => {
  let cmd: CmdServer;
  let db: ServiceDatabase;
  let profile: ModelProfile;

  beforeEach(async () => {
    db = new ServiceDatabase();
    profile = new ModelProfile(db);
    cmd = new CmdServer(db, profile, new Command(), inquirer);
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

        expect(cmd.lastLog).to.contain(`Current server is "${url}"`);
      });

      it('should display an error if no server has been set', async () => {
        const cmdInit = new CmdServer(db, profile, new Command(), inquirer);

        await cmdInit.action();

        expect(cmdInit.lastLogErr).to.contain('Please set a server');
      });
    });

    describe('server [url]', () => {
      it('should write to the user profile with the server"', async () => {
        const url = 'http://asdf.com';

        await cmd.action(url);
        await profile.load();

        expect(profile.server).to.eq(url);
        expect(cmd.lastLog).to.contain(`Server set to "${url}"`);
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
