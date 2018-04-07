import { CmdBase } from '../../base/base.cmd';
import { Questions } from 'inquirer';
import * as inquirer from 'inquirer';

export interface ICmdRegisterAnswers {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

export class CmdRegister extends CmdBase {
  private questions: Questions = [
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

  get name (): string {
    return 'register';
  }

  get description (): string {
    return 'Register a new user by following the prompts';
  }

  protected get requireServer (): boolean {
    return true;
  }

  protected onAction (): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      const answers = await inquirer.prompt(this.questions) as ICmdRegisterAnswers;

      if (answers.password !== answers.passwordConfirm) {
        reject('Error: Passwords do not match');
        return;
      }

      try {
        await this.serviceAuthentication.register({
          name: answers.name,
          email: answers.email,
          password: answers.password,
        });

        this.logSuccess.print(`Created user ${answers.email}. Please login to make requests`);
      } catch (err) {
        reject(err);
        return;
      }

      resolve();
    });
  }
}
