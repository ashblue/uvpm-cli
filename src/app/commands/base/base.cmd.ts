import { Command } from 'commander';
import { appConfig } from '../../shared/config';
import { Inquirer } from 'inquirer';
import { ICmdOption } from './i-cmd-option';
import { ServiceDatabase } from '../../services/database/database.service';
import { ModelProfile } from '../../models/profile/profile.model';
import { ModelUvpmConfig } from '../../models/uvpm/uvpm-config.model';
import { ServicePackages } from '../../services/packages/packages.service';
import { ServicePackageVersions } from '../../services/package-versions/package-versions.service';
import { TerminalLog } from './terminal-log/terminal-log';
import { LogType } from './terminal-log/log-type';
import { ServiceCache } from '../../services/cache/cache.service';
import { ServiceAuthentication } from '../../services/authentication/authentication.service';

export abstract class CmdBase {
  public abstract get name (): string;
  public abstract get description (): string;

  public log = new TerminalLog(LogType.Default);
  public logSuccess = new TerminalLog(LogType.Success);
  public logWarning = new TerminalLog(LogType.Warning);
  public logError = new TerminalLog(LogType.Error);

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
    protected serviceCache: ServiceCache,
    protected serviceAuthentication: ServiceAuthentication,
  ) {
    this.addCliCommnd();
  }

  public action (argA?: any, argB?: any, argC?: any): Promise<void> {
    return new Promise<void>(async (resolve) => {
      if (this.requireUvpmJson && !this.config.isFile) {
        this.logError.print(
          'Please create a uvpm.json file via "uvpm init" or run this command in a folder with a uvpm.json file');
        resolve();
        return;
      }

      if (this.requireServer && !this.profile.isServer) {
        this.logError.print('Please set a server before using this action by running "uvpm server [URL]"');
        resolve();
        return;
      }

      if (this.requireLogin && !this.profile.isLoggedIn) {
        this.logError.print('Please login before using this action by running "uvpm login"');
        resolve();
        return;
      }

      this.onAction(argA, argB, argC)
        .then(() => {
          resolve();
          this.complete();
        })
        .catch((err) => {
          this.logError.print(`UVPM command ${this.name} failed. Error log as follows:`);
          this.logError.print(err);

          resolve();
          this.complete();
        });
    });
  }

  protected abstract onAction (argA?: any, argB?: any, argC?: any): Promise<void>;

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
