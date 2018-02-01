import { Command } from 'commander';
import { config } from '../../shared/config';

export abstract class CmdBase {
  protected abstract get name (): string;
  protected abstract get description (): string;

  constructor (public program: Command) {
    this.addCliCommnd();
  }

  protected abstract action (): void;

  /**
   * Call upon completion to exit the running command
   */
  protected complete () {
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
