import { CmdBase } from '../../base/base.cmd';
import chalk from 'chalk';
import { Questions } from 'inquirer';
import { configDefaults, ModelUvpmConfig } from '../../../models/uvpm/uvpm-config.model';
import { IUvpmConfig } from '../../../shared/interfaces/uvpm/config/i-uvpm-config';
import * as fs from 'fs';

export class CmdInit extends CmdBase {
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

  public get name (): string {
    return 'init';
  }

  public get description (): string {
    return `Generates a "${ModelUvpmConfig.fileName}" file from where the command is run.
      Automatically fails if a file already exists.`;
  }

  protected onAction (): Promise<void> {
    this.log(chalk.bold(`${ModelUvpmConfig.fileName} file generator`));
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
          this.log(chalk.green(`Created file ${ModelUvpmConfig.fileName} successfully`));
          resolve();
        })
        .catch(/* istanbul ignore next */(err) => {
          this.logErr(chalk.red(`Failed to generate ${ModelUvpmConfig.fileName}`));
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
    const configString = JSON.stringify(configData, null, 2);

    return new Promise((resolve, reject) => {
      const path = `./${ModelUvpmConfig.fileName}`;

      if (fs.existsSync(path)) {
        reject(`Cannot overwrite ${ModelUvpmConfig.fileName}`);
        return;
      }

      fs.writeFile(path, configString, (err) => {
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
