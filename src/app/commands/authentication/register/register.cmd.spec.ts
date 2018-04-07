import { A } from '../../../shared/tests/builder/a';
import { CmdRegister, ICmdRegisterAnswers } from './register.cmd';
import { expect } from 'chai';
import { ModelProfile } from '../../../models/profile/profile.model';
import { ServiceDatabase } from '../../../services/database/database.service';
import * as inquirer from 'inquirer';
import * as sinon from 'sinon';
import { ServiceAuthentication } from '../../../services/authentication/authentication.service';
import { ServiceAxios } from '../../../services/axios/axios.service';
import { IUserRegister } from '../../../shared/interfaces/user/i-user-register';
import { SinonStub } from 'sinon';

describe('RegisterCmd', () => {
  let cmd: CmdRegister;
  let profile: ModelProfile;
  let serviceDatabase: ServiceDatabase;
  let serviceAuthentication: ServiceAuthentication;

  beforeEach(() => {
    serviceDatabase = new ServiceDatabase();

    profile = new ModelProfile(serviceDatabase);
    profile.server = 'http://uvpm.com';
    profile.email = 'asdf@asdf.com';
    profile.token = '12345';

    const serviceAxios = new ServiceAxios(profile);
    serviceAuthentication = new ServiceAuthentication(profile, serviceAxios);

    cmd = A.command()
      .withServiceDatabase(serviceDatabase)
      .withModelProfile(profile)
      .withServiceAuthentication(serviceAuthentication)
      .withServiceAxios(serviceAxios)
      .build(CmdRegister);
  });

  it('should initialize', () => {
    expect(cmd).to.be.ok;
  });

  it('should fail if the server is not set', async () => {
    const errMsg = 'Please set a server before using this action';

    profile.server = null;
    await cmd.action();

    expect(cmd.logError.lastEntry).to.contain(errMsg);
  });

  describe('uvpm register', () => {
    let answers: ICmdRegisterAnswers;

    let stubInquirerPrompt: SinonStub;
    let stubServiceAuthenticationRegister: SinonStub;

    beforeEach(() => {
      answers = {
        name: 'Lorem Ipsum',
        email: 'asdf@asdf.com',
        password: 'asdfasdf1',
        passwordConfirm: 'asdfasdf1',
      };

      stubInquirerPrompt = sinon.stub(inquirer, 'prompt');
      stubInquirerPrompt.callsFake(() => {
        return new Promise((resolve) => resolve(answers));
      });

      stubServiceAuthenticationRegister = sinon.stub(serviceAuthentication, 'register');
      stubServiceAuthenticationRegister.callsFake(() => {
        return new Promise((resolve) => resolve());
      });
    });

    afterEach(() => {
      stubInquirerPrompt.restore();
    });

    it('should ask questions via inquirer', async () => {
      const questions: inquirer.Questions = [
        {
          type: 'input',
          name: 'email',
          message: 'Email address?',
        },
        {
          type: 'input',
          name: 'name',
          message: 'Name?',
        },
        {
          type: 'password',
          name: 'password',
          message: `Password? (characters hidden)`,
        },
        {
          type: 'password',
          name: 'passwordConfirm',
          message: `Confirm password? (characters hidden)`,
        },
      ];

      await cmd.action();

      expect(stubInquirerPrompt.calledWith(questions)).to.be.ok;
    });

    it('should receive send the user\'s answers to the registration service', async () => {
      const registerArguments: IUserRegister = {
        name: answers.name,
        email: answers.email,
        password: answers.password,
      };

      await cmd.action();

      expect(stubServiceAuthenticationRegister.calledWith(registerArguments)).to.be.ok;
    });

    it('should display a success message with the new user details', async () => {
      await cmd.action();

      expect(cmd.logSuccess.lastEntry).to
        .eq(`Created user ${answers.email}. Please login to make requests`);
    });

    it('should not error if passwords match', async () => {
      const password = 'asdfadsf1';
      answers.password = password;
      answers.passwordConfirm = password;

      await cmd.action();

      expect(cmd.logError.lastEntry).to.not.eq('Error: Passwords do not match');
    });

    it('should error if passwords do not match', async () => {
      answers.password = 'asdfadsf1';
      answers.passwordConfirm = '';

      await cmd.action();

      expect(cmd.logError.lastEntry).to.eq('Error: Passwords do not match');
    });

    it('should display an error if createUser fails', async () => {
      const errResponse = { error: 'I\'m an error' };

      stubServiceAuthenticationRegister.callsFake(() => {
        // @ts-ignore
        return new Promise((resolve, reject) => {
          reject(errResponse);
        });
      });

      await cmd.action();

      expect(cmd.logError.lastEntry).eq(JSON.stringify(errResponse));
    });
  });
});
