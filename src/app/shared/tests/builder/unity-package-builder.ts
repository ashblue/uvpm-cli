import { ExampleProjectUnity } from '../example-project/unity/example-project-unity';
import { IUvpmPackage } from '../../interfaces/uvpm/config/i-uvpm-config-package';
import { ModelVersion } from '../../../models/version/version.model';

export class UnityPackageBuilder {
  private _name?: string = undefined;
  private _version: ModelVersion = new ModelVersion('1.0.0');
  private _dependencies: IUvpmPackage[] = [];

  public withName (name: string) {
    this._name = name;
    return this;
  }

  public withVersion (version: string) {
    this._version = new ModelVersion(version);
    return this;
  }

  public withDependency (name: string, version = '1.0.0') {
    this._dependencies.push({
      name,
      version,
    });

    return this;
  }

  public async build () {
    const unity = new ExampleProjectUnity((config) => {
      if (this._name) {
        config.name = this._name;
      }

      config.version = this._version;

      config.dependencies.packages = config.dependencies.packages.concat(this._dependencies);
    });

    await unity.createArchive();

    return unity;
  }
}
