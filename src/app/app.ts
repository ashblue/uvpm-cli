import { CommandCollection } from './commands/command-collection';
import { Command } from 'commander';
import * as inquirer from 'inquirer';
import { config } from './shared/config';

export class App {
  private commandCollection = new CommandCollection(new Command(), inquirer);

  public init () {
    /* istanbul ignore if */
    if (!config.isEnvTest()) {
      this.commandCollection.listen();
    }
  }
}
