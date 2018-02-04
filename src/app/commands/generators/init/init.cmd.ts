import { CmdBase } from '../../base/base.cmd';
import chalk from 'chalk';
import { Questions } from 'inquirer';
import { configDefaults, ModelUvpmConfig } from '../../../shared/models/uvpm/uvpm-config.model';
import { IUvpmConfig } from '../../../shared/interfaces/uvpm/config/i-uvpm-config';
import * as fs from 'fs';

export class CmdInit extends CmdBase {
  public static fileName = 'uvpm.json';

  private questions: Questions = [
    {
      type: 'input',
      name: 'name',
      message: 'Name of this package?',
    },
    {
      type: 'input',
      name: 'version',
      message: `Starting package version number? (${configDefaults.version})`,
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description?',
    },
    {
      type: 'input',
      name: 'author',
      message: 'Author?',
    },
    {
      type: 'input',
      name: 'license',
      message: `License? (${configDefaults.license})`,
    },
  ];

  protected get name (): string {
    return 'init';
  }

  protected get description (): string {
    return `Helps generate a ${CmdInit.fileName} file`;
  }

  protected onAction (): Promise<void> {
    this.log(chalk.bold(`${CmdInit.fileName} file generator`));
    return this.createAnswers();
  }

  protected createAnswers (): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.inquirer.prompt(this.questions)
        .then((answers) => {
          this.log(chalk.yellow('Generating file...'));
          return this.createConfig(answers as IUvpmConfig);
        })
        .then(() => {
          this.log(chalk.green(`Created file ${CmdInit.fileName} successfully`));
          resolve();
        })
        .catch(/* istanbul ignore next */(err) => {
          this.logErr(chalk.red(`Failed to generate ${CmdInit.fileName}`));
          this.logErr('Error Log:');
          this.logErr(err);

          reject(err);
        });
    });
  }

  protected createConfig (overrides: any): Promise<void> {
    const overridesSanitize = Object.keys(overrides)
      .reduce<any>((col, key) => {
        const val = overrides[key];
        if (val && val !== '') {
          col[key] = val;
        }

        return col;
      }, {}) as IUvpmConfig;

    const configData = new ModelUvpmConfig(overridesSanitize);
    const configString = JSON.stringify(configData);

    return new Promise((resolve, reject) => {
      fs.writeFile(`./${CmdInit.fileName}`, configString, (err) => {
        /* istanbul ignore if */
        if (err) {
          reject(err);
          return;
        }

        resolve();
      });
    });
  }
}
