import chalk from 'chalk';
import { CmdBase } from '../base/base.cmd';

export class CmdHelloWord extends CmdBase {
  protected get name (): string {
    return 'hello-world';
  }

  protected get description (): string {
    return 'Prints "Hello World!"';
  }

  protected action (): void {
    this.helloWorld();
  }

  private helloWorld () {
    console.log(chalk.blue('Hello World!'));
    this.complete();
  }
}
