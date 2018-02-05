import { Command } from 'commander';
import { config } from '../../shared/config';
import { Inquirer } from 'inquirer';
import { ICmdOption } from './i-cmd-option';

export abstract class CmdBase {
  public abstract get name (): string;
  public abstract get description (): string;

  /**
   * Only populated during testing for debugging purposes
   * @type {any[]}
   */
  public logHistory: string[] = [];

  /**
   * Only populated during testing for debugging purposes
   * @type {any[]}
   */
  public logErrHistory: string[] = [];

  public get lastLog (): string {
    if (this.logHistory.length > 0) {
      return this.logHistory[this.logHistory.length - 1];
    }

    return '';
  }

  public get lastLogErr (): string {
    if (this.logErrHistory.length > 0) {
      return this.logErrHistory[this.logErrHistory.length - 1];
    }

    return '';
  }

  protected get options (): ICmdOption[] {
    return [];
  }

  constructor (protected program: Command, protected inquirer: Inquirer) {
    this.addCliCommnd();
  }

  public action (argA?: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.onAction(argA)
        .then(() => {
          resolve();
          this.complete();
        })
        .catch((err) => {
          this.logErr(`UVPM command ${this.name} failed. Error log as follows:`);
          this.logErr(err);

          reject(err);
          this.complete();
        });
    });
  }

  protected abstract onAction (argA?: string): Promise<void>;

  /* istanbul ignore next: floods the test runner with logs */
  protected logErr (text: string) {
    if (config.isEnvTest()) {
      this.logErrHistory.push(text);
      return;
    }

    console.error(text);
  }

  /* istanbul ignore next: floods the test runner with logs */
  protected log (text: string) {
    if (config.isEnvTest()) {
      this.logHistory.push(text);
      return;
    }

    console.log(text);
  }

  private complete () {
    /* istanbul ignore if: crashes test runner */
    if (!config.isEnvTest()) {
      process.exit();
    }
  }

  private addCliCommnd (): void {
    const cmd = this.program
      .command(this.name)
      .description(this.description);

    if (this.options) {
      this.options.forEach((o) => {
        if (o.fn) {
          cmd.option(o.flags, o.description, o.fn, o.defaultValue);
        } else {
          cmd.option(o.flags, o.description, o.defaultValue);
        }
      });
    }

    cmd.action(this.action.bind(this));
  }
}
