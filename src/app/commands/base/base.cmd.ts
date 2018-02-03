import { Command } from 'commander';
import { config } from '../../shared/config';

export abstract class CmdBase {
  protected abstract get name (): string;
  protected abstract get description (): string;

  constructor (public program: Command) {
    this.addCliCommnd();
  }

  protected abstract action (): void;

  protected complete () {
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
