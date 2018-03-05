import { CmdBase } from '../../base/base.cmd';
import { ModelUvpmConfig } from '../../../models/uvpm/uvpm-config.model';
import { ModelVersion } from '../../../models/version/version.model';

export class CmdVersion extends CmdBase {
  /**
   * Overridable testing method for UVPM.json files
   * @returns {ModelUvpmConfig}
   */
  // istanbul ignore next
  get uvpmConfig (): ModelUvpmConfig {
    return new ModelUvpmConfig();
  }

  get name (): string {
    return 'version [newVersion]';
  }

  get description (): string {
    return `Set a new version directly "uvpm version 1.0.1".
      Or increment the current version "uvpm version major|minor|patch" as so "uvpm version minor".
      Versioning is based upon the Semantic Versioning specification. See semver.org to learn more.`;
  }

  // istanbul ignore next: Stubbed during testing
  protected get requireUvpmJson (): boolean {
    return true;
  }

  protected onAction (newVersion?: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const uvpmConfig = this.uvpmConfig;

      uvpmConfig.load()
        .then(() => {
          if (!newVersion) {
            this.log(`Package ${uvpmConfig.name} is on version ${uvpmConfig.version}`);
            resolve();
            return;
          }

          this.incrementVersion(uvpmConfig, newVersion)
            .then(() => {
              this.log(`Package ${uvpmConfig.name} version set to ${uvpmConfig.version}`);
              resolve();
            })
            .catch(reject);
        });
    });
  }

  private incrementVersion (uvpmConfig: ModelUvpmConfig, newVersion: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      switch (newVersion) {
        case 'major':
          uvpmConfig.version.addMajor();
          break;
        case 'minor':
          uvpmConfig.version.addMinor();
          break;
        case 'patch':
          uvpmConfig.version.addPatch();
          break;
        default:
          if (ModelVersion.isValid(newVersion)) {
            uvpmConfig.version = new ModelVersion(newVersion);
          } else {
            reject('Cannot set an invalid version. Must be formatted as X.X.X');
            return;
          }
      }

      uvpmConfig.save()
        .then(resolve)
        .catch(reject);
    });
  }
}
