import { Command } from 'commander';
import { config } from '../../shared/config';
import { Inquirer } from 'inquirer';

export abstract class CmdBase {
  protected abstract get name (): string;
  protected abstract get description (): string;

  constructor (protected program: Command, protected inquirer: Inquirer) {
    this.addCliCommnd();
  }

  /* istanbul ignore next: catch does not necessarily need to fire */
  public action (): Promise<void> {
    return this.onAction()
      .then(() => {
        this.complete();
      })
      .catch(() => {
        this.complete();
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
