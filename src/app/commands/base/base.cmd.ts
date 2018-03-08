import { Command } from 'commander';
import { appConfig } from '../../shared/config';
import { Inquirer } from 'inquirer';
import { ICmdOption } from './i-cmd-option';
import { ServiceDatabase } from '../../services/database/database.service';
import { ModelProfile } from '../../models/profile/profile.model';
import { ModelUvpmConfig } from '../../models/uvpm/uvpm-config.model';
import { ServicePackages } from '../../services/packages/packages.service';
import { ServicePackageVersions } from '../../services/package-versions/package-versions.service';

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

  /**
   * Immediately fail if the user is not logged in
   * @returns {boolean}
   */
  protected get requireLogin (): boolean {
    return false;
  }

  /**
   * Immediately fail if a server has not been set
   * @returns {boolean}
   */
  protected get requireServer (): boolean {
    return false;
  }

  protected get requireUvpmJson (): boolean {
    return false;
  }

  constructor (
    protected db: ServiceDatabase,
    protected profile: ModelProfile,
    protected config: ModelUvpmConfig,
    protected program: Command,
    protected inquirer: Inquirer,
    protected servicePackages: ServicePackages,
    protected servicePackageVersions: ServicePackageVersions,
  ) {
    this.addCliCommnd();
  }

  public action (argA?: string, argB?: string): Promise<void> {
    return new Promise<void>(async (resolve) => {
      if (this.requireUvpmJson && !this.config.isFile) {
        this.logErr(
          'Please create a uvpm.json file via "uvpm init" or run this command in a folder with a uvpm.json file');
        resolve();
        return;
      }

      if (this.requireServer && !this.profile.isServer) {
        this.logErr('Please set a server before using this action by running "uvpm server [URL]"');
        resolve();
        return;
      }

      if (this.requireLogin && !this.profile.isLoggedIn) {
        this.logErr('Please login before using this action by running "uvpm login"');
        resolve();
        return;
      }

      this.onAction(argA, argB)
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

  protected abstract onAction (argA?: string, argB?: string): Promise<void>;

  /* istanbul ignore next: floods the test runner with logs */
  protected logErr (text: string) {
    if (appConfig.isEnvTest) {
      this.logErrHistory.push(text);
      return;
    }

    console.error(text);
  }

  /* istanbul ignore next: floods the test runner with logs */
  protected log (text: string) {
    if (appConfig.isEnvTest) {
      this.logHistory.push(text);
      return;
    }

    console.log(text);
  }

  private complete () {
    /* istanbul ignore if: crashes test runner */
    if (!appConfig.isEnvTest) {
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
