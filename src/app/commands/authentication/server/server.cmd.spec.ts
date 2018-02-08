import * as chai from 'chai';
import { Command } from 'commander';
import { CmdServer } from './server.cmd';
import * as inquirer from 'inquirer';
import { ModelProfile } from '../../../shared/models/profile/profile.model';

const expect = chai.expect;

describe('CmdServer', () => {
  it('should initialize', () => {
    const cmd = new CmdServer(new Command(), inquirer);
    expect(cmd).to.be.ok;
  });

  describe('when initialized', () => {
    describe('server', () => {
      it('should print the current server', async () => {
        const url = 'http://asdf.com';
        const cmdServer = new CmdServer(new Command(), inquirer);

        await cmdServer.action(url);
        await cmdServer.action();

        expect(cmdServer.lastLog).to.contain(`Current server is "${url}"`);
      });

      it('should display an error if no server has been set', async () => {
        const cmdInit = new CmdServer(new Command(), inquirer);

        await cmdInit.action();

        expect(cmdInit.lastLogErr).to.contain('Please set a server');
      });
    });

    describe('server [url]', () => {
      it('should write to the user profile with the server"', async () => {
        const url = 'http://asdf.com';
        const cmdServer = new CmdServer(new Command(), inquirer);
        const profile = new ModelProfile();

        await cmdServer.action(url);
        await profile.load();

        expect(profile.server).to.eq(url);
        expect(cmdServer.lastLog).to.contain(`Server set to "${url}"`);
      });

      it('should overwrite the previous url if run again', async () => {
        const url = 'http://asdf.com';
        const newUrl = 'http://fdsa.com';
        const cmdServer = new CmdServer(new Command(), inquirer);
        const profile = new ModelProfile();

        await cmdServer.action(url);
        await cmdServer.action(newUrl);
        await profile.load();

        expect(profile.server).to.eq(newUrl);
      });
    });
  });
});
