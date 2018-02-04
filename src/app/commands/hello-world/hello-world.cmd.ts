import chalk from 'chalk';
import { CmdBase } from '../base/base.cmd';

export class CmdHelloWord extends CmdBase {
  public get name (): string {
    return 'hello-world';
  }

  public get description (): string {
    return 'Prints "Hello World!"';
  }

  protected onAction (): Promise<void> {
    return new Promise<void>((resolve) => {
      this.helloWorld();
      resolve();
    });
  }

  private helloWorld () {
    console.log(chalk.blue('Hello World!'));
  }
}
