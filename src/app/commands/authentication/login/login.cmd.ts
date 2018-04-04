import { CmdBase } from '../../base/base.cmd';
import chalk from 'chalk';
import { ModelProfile } from '../../../models/profile/profile.model';
import { ILoginRequest } from './i-login-request';
import { Questions } from 'inquirer';
import { ILoginResponse } from './i-login-response';
import axios from 'axios';

export class CmdLogin extends CmdBase {
  private postUrl = 'api/v1/users/login';

  private questions: Questions = [
    {
      type: 'input',
      name: 'email',
      message: 'Email address?',
    },
    {
      type: 'password',
      name: 'password',
      message: `Password? (characters hidden)`,
    },
  ];

  get name (): string {
    return 'login';
  }

  get description (): string {
    return 'Attempt to authenticate a user and store login credentials.';
  }

  protected async onAction (): Promise<void> {
    const profile = new ModelProfile(this.db);
    await profile.load();

    return new Promise<void>((resolve, reject) => {
      if (!profile.isServer) {
        reject(chalk.red(`Please run "uvpm server [URL]" to set an end point`));
        return;
      }

      const loginUrl = `${profile.server}/${this.postUrl}`;
      this.log.print(chalk.bold(`Logging into "${loginUrl}"`));

      return this.inquirer.prompt(this.questions)
        .then((answers) => {
          const loginRequest = answers as ILoginRequest;

          // @TODO Wrap axios authentication commands into a service
          return axios.post(loginUrl, loginRequest);
        })
        .then(async (response) => {
          const data = response.data as ILoginResponse;
          profile.token = data.token;
          profile.email = data.user.email;

          await profile.save();

          this.logSuccess.print(`Successfully logged in as ${profile.email}`);

          resolve();
        }, (reason) => {
          if (!reason.response) {
            reject(reason.toString());
            return;
          }

          reject(reason.response.data);
        });
    });
  }
}
