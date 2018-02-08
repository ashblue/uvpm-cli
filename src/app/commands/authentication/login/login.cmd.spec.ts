import * as chai from 'chai';
import { CmdLogin } from './login.cmd';
import { Command } from 'commander';
import { StubInquirer } from '../../../shared/stubs/stub-inquirer';
import { ModelProfile } from '../../../shared/models/profile/profile.model';
import { ILoginRequest } from './i-login-request';
import * as nock from 'nock';
import { ILoginResponse } from './i-login-response';
import { IUvpmError } from '../../../shared/interfaces/uvpm/i-uvpm-error';

const expect = chai.expect;

describe('CmdLogin', () => {
  it('should initialize', () => {
    const cmd = new CmdLogin(new Command(), new StubInquirer() as any);
    expect(cmd).to.be.ok;
  });

  describe('when initialized', () => {
    afterEach(async () => {
      const profile = new ModelProfile();
      await profile.clear();
    });

    it('should fail if a server is not set', async () => {
      const cmd = new CmdLogin(new Command(), new StubInquirer() as any);
      await cmd.action();

      expect(cmd.lastLogErr).to.contain('Please run "uvpm server [URL]" to set an end point');
    });

    it('should return login credentials for a registered user', async () => {
      const login: ILoginRequest = {
        email: 'asdf@asdf.com',
        password: 'Asdf1234',
      };

      const cmd = new CmdLogin(new Command(), new StubInquirer(login) as any);

      const profile = new ModelProfile();
      profile.server = 'http://testapp.com';
      await profile.save();

      const loginResponse: ILoginResponse = {
        token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjVhNzkwNmUzNTU' +
        '4NjZmMDA0Njg5M2JmYiJ9.SNGBduk8CzBrpy70m_AvHLn-AANrfY8IPdwOviXIEtU',
        user: {
          createdAt: '2018-02-06T01:37:39.166Z',
          name: 'Loerm Ipsum',
          email: login.email,
          id: '5a7906e355866f0046893bfb',
        },
      };

      nock(`${profile.server}`)
        .post(`/api/v1/users/login`, login)
        .reply(200, loginResponse);

      await cmd.action();
      expect(cmd.logHistory[0]).to.contain(`Logging into "${profile.server}/api/v1/users/login"`);
      expect(cmd.logHistory[1]).to.contain(`Successfully logged in as ${profile.email}`);

      await profile.load();
      expect(profile.email).to.eq(login.email);
      expect(profile.isToken).to.be.ok;
    });

    it('should print an error if the user fails to login (401)', async () => {
      const login: ILoginRequest = {
        email: 'asdf@asdf.com',
        password: 'Asdf1234',
      };

      const cmd = new CmdLogin(new Command(), new StubInquirer(login) as any);

      const profile = new ModelProfile();
      profile.server = 'http://testapp.com';
      await profile.save();

      const loginResponse: IUvpmError = {
        message: 'Not authenticated',
      };

      nock(`${profile.server}`)
        .post(`/api/v1/users/login`, login)
        .reply(401, loginResponse);

      await cmd.action();
      expect(JSON.stringify(cmd.lastLogErr)).to.contain(loginResponse.message);

      await profile.load();
      expect(profile.email).to.eq('');
      expect(profile.isToken).to.be.not.ok;
    });

    it('should print an error if the server fails to respond (500)', async () => {
      const login: ILoginRequest = {
        email: 'asdf@asdf.com',
        password: 'Asdf1234',
      };

      const cmd = new CmdLogin(new Command(), new StubInquirer(login) as any);

      const profile = new ModelProfile();
      profile.server = 'http://testapp.com';
      await profile.save();

      const loginResponse = 'server failed to process response';

      nock(`${profile.server}`)
        .post(`/api/v1/users/login`, login)
        .replyWithError(loginResponse);

      await cmd.action();
      expect(cmd.lastLogErr).to.contain(loginResponse);

      await profile.load();
      expect(profile.email).to.eq('');
      expect(profile.isToken).to.be.not.ok;
    });

    it('should print an error if the server does not exist', async () => {
      const login: ILoginRequest = {
        email: 'asdf@asdf.com',
        password: 'Asdf1234',
      };

      const cmd = new CmdLogin(new Command(), new StubInquirer(login) as any);

      const profile = new ModelProfile();
      profile.server = 'http://testapp.com';
      await profile.save();

      await cmd.action();
      expect(cmd.lastLogErr).to.be.ok;

      await profile.load();
      expect(profile.email).to.eq('');
      expect(profile.isToken).to.be.not.ok;
    });
  });
});
