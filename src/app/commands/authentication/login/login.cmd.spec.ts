import * as chai from 'chai';
import { CmdLogin } from './login.cmd';
import { StubInquirer } from '../../../shared/stubs/stub-inquirer';
import { ModelProfile } from '../../../models/profile/profile.model';
import { ILoginRequest } from './i-login-request';
import * as nock from 'nock';
import { ILoginResponse } from './i-login-response';
import { IUvpmError } from '../../../shared/interfaces/uvpm/i-uvpm-error';
import { ServiceDatabase } from '../../../services/database/database.service';
import { ModelUvpmConfig } from '../../../models/uvpm/uvpm-config.model';
import { ServicePackageVersions } from '../../../services/package-versions/package-versions.service';
import { ServicePackages } from '../../../services/packages/packages.service';
import { A } from '../../../shared/tests/builder/a';
import { ServiceAxios } from '../../../services/axios/axios.service';

const expect = chai.expect;

describe('CmdLogin', () => {
  let db: ServiceDatabase;
  let profile: ModelProfile;
  let config: ModelUvpmConfig;
  let stubInquirer: StubInquirer;
  let cmd: CmdLogin;
  let servicePackages: ServicePackages;
  let servicePackageVersions: ServicePackageVersions;

  beforeEach(async () => {
    db = new ServiceDatabase();
    profile = new ModelProfile(db);
    config = new ModelUvpmConfig();
    stubInquirer = new StubInquirer();

    const serviceAxis = new ServiceAxios(profile);
    servicePackages = new ServicePackages(profile, serviceAxis);
    servicePackageVersions = new ServicePackageVersions(profile, serviceAxis);

    cmd = A.command()
      .withServiceDatabase(db)
      .withModelProfile(profile)
      .withModelUvpmConfig(config)
      .withInquirer(stubInquirer as any)
      .withServicePackages(servicePackages)
      .withServicePackageVersions(servicePackageVersions)
      .build(CmdLogin);
  });

  it('should initialize', () => {
    expect(cmd).to.be.ok;
  });

  it('should fail if a server is not set', async () => {
    await cmd.action();

    expect(cmd.logError.lastEntry).to.contain('Please run "uvpm server [URL]" to set an end point');
  });

  it('should return login credentials for a registered user', async () => {
    const login: ILoginRequest = {
      email: 'asdf@asdf.com',
      password: 'Asdf1234',
    };

    stubInquirer.answers = login;

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
    await profile.load();

    expect(cmd.log.lastEntry).to.contain(`Logging into "${profile.server}/api/v1/users/login"`);
    expect(cmd.logSuccess.lastEntry).to.contain(`Successfully logged in as ${profile.email}`);

    await profile.load();
    expect(profile.email).to.eq(login.email);
    expect(profile.isToken).to.be.ok;
  });

  describe('failure', () => {
    const login: ILoginRequest = {
      email: 'asdf@asdf.com',
      password: 'Asdf1234',
    };

    beforeEach(async () => {
      stubInquirer.answers = login;

      profile.server = 'http://testapp.com';
      await profile.save();
    });

    it('should print an error if the user fails to login (401)', async () => {
      const loginResponse: IUvpmError = {
        message: 'Not authenticated',
      };

      nock(`${profile.server}`)
        .post(`/api/v1/users/login`, login)
        .reply(401, loginResponse);

      await cmd.action();
      expect(JSON.stringify(cmd.logError.lastEntry)).to.contain(loginResponse.message);

      await profile.load();
      expect(profile.email).to.eq(null);
      expect(profile.isToken).to.be.not.ok;
    });

    it('should print an error if the server fails to respond (500)', async () => {
      const loginResponse = 'server failed to process response';

      nock(`${profile.server}`)
        .post(`/api/v1/users/login`, login)
        .replyWithError(loginResponse);

      await cmd.action();
      expect(cmd.logError.lastEntry).to.contain(loginResponse);

      await profile.load();
      expect(profile.email).to.eq(null);
      expect(profile.isToken).to.be.not.ok;
    });

    it('should print an error if the server does not exist', async () => {
      await cmd.action();
      expect(cmd.logError.lastEntry).to.be.ok;

      await profile.load();
      expect(profile.email).to.eq(null);
      expect(profile.isToken).to.be.not.ok;
    });

    it('should not print a success message on failure', async () => {
      const loginResponse: IUvpmError = {
        message: 'Not authenticated',
      };

      nock(`${profile.server}`)
        .post(`/api/v1/users/login`, login)
        .reply(401, loginResponse);

      await cmd.action();

      expect(cmd.logSuccess.lastEntry).to.not.be.ok;
    });

    it('should print the exact error text to the console', async () => {
      const loginResponse: any = {
        message: 'Not authenticated',
        nestedData: {
          myText: 'Nested text',
        },
      };

      nock(`${profile.server}`)
        .post(`/api/v1/users/login`, login)
        .reply(401, loginResponse);

      await cmd.action();

      expect(cmd.logError.lastEntry).to.eq(JSON.stringify(loginResponse));
    });
  });
});
