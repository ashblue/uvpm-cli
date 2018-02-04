import { Command } from 'commander';
import { config } from '../../shared/config';
import { Inquirer } from 'inquirer';

export abstract class CmdBase {
  public abstract get name (): string;
  public abstract get description (): string;

  constructor (protected program: Command, protected inquirer: Inquirer) {
    this.addCliCommnd();
  }

  public action (): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.onAction()
        .then(() => {
          resolve();
          this.complete();
        })
        .catch((err) => {
          reject(err);
          this.complete();
        });
    });
  }

  protected abstract onAction (): Promise<void>;

  /* istanbul ignore next: floods the test runner with logs */
  protected logErr (text: string) {
    if (config.isEnvTest()) {
      return;
    }

    console.error(text);
  }

  /* istanbul ignore next: floods the test runner with logs */
  protected log (text: string) {
    if (config.isEnvTest()) {
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
    this.program
      .command(this.name)
      .description(this.description)
      .action(this.action.bind(this));
  }
}
