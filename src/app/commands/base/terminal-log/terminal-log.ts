import { appConfig } from '../../../shared/config';
import { LogType } from './log-type';
import chalk from 'chalk';

export class TerminalLog {
  private _history: string[] = [];
  private _displayType: LogType = LogType.Default;

  public get lastEntry (): string {
    return this._history[this._history.length - 1];
  }

  public get history (): string[] {
    return this._history;
  }

  constructor (displayType: LogType) {
    this._displayType = displayType;
  }

  /* istanbul ignore next: floods the test runner with logs */
  public print (text: any|string) {
    // Force convert invalid strings
    if (typeof text !== 'string') {
      text = JSON.stringify(text);
    }

    if (appConfig.isEnvTest) {
      this._history.push(text);
      return;
    }

    const textWithColor = this.wrapWithColor(text);

    switch (this._displayType) {
      case LogType.Error:
        console.error(textWithColor);
        break;
      case LogType.Warning:
        console.warn(textWithColor);
        break;
      default:
        console.log(textWithColor);
    }
  }

  // istanbul ignore next: Never fires since print does not trigger in tests
  private wrapWithColor (text: string) {
    switch (this._displayType) {
      case LogType.Error:
        return chalk.red(text);
      case LogType.Success:
        return chalk.green(text);
      case LogType.Warning:
        return chalk.yellow(text);
    }

    return text;
  }
}
