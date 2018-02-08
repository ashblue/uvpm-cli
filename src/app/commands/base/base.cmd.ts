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
    return this.logHistory[this.logHistory.length - 1];
  }

  /* istanbul ignore next */
  public get lastLogErr (): string {
    return this.logErrHistory[this.logErrHistory.length - 1];
  }

  protected get options (): ICmdOption[] {
    return [];
  }

  constructor (protected program: Command, protected inquirer: Inquirer) {
    this.addCliCommnd();
  }

  public action (argA?: string): Promise<void> {
    return new Promise<void>((resolve) => {
      this.onAction(argA)
        .then(() => {
          resolve();
          this.complete();
        })
        .catch((err) => {
          this.logErr(`UVPM command ${this.name} failed. Error log as follows:`);
          this.logErr(err);

          resolve();
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

    /* istanbul ignore next: Tmp ignored until some actual options are here to test */
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
