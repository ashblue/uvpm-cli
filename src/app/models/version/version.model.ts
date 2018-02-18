import { ISemanticVersion } from '../../shared/interfaces/versions/i-semantic-version';

const VERSION_DEFAULTS: ISemanticVersion = {
  major: 1,
  minor: 0,
  patch: 0,
};

Object.freeze(VERSION_DEFAULTS);

export class ModelVersion implements ISemanticVersion {
  public static isValid (version: string) {
    return /^[0-9]+.[0-9]+.[0-9]+$/.exec(version);
  }

  public major: number = VERSION_DEFAULTS.major;
  public minor: number = VERSION_DEFAULTS.minor;
  public patch: number = VERSION_DEFAULTS.patch;

  constructor (versionString?: string) {
    if (versionString) {
      this.stringToVersion(versionString);
    }
  }

  public toString (): string {
    return `${this.major}.${this.minor}.${this.patch}`;
  }

  public toJSON (): string {
    return this.toString();
  }

  public addMajor () {
    this.major += 1;
    this.minor = 0;
    this.patch = 0;
  }

  public addMinor () {
    this.minor += 1;
    this.patch = 0;
  }

  public addPatch () {
    this.patch += 1;
  }

  private stringToVersion (s: string): boolean {
    const split = s.split('.');

    this.major = parseInt(split[0], 10);
    this.minor = parseInt(split[1], 10);
    this.patch = parseInt(split[2], 10);

    // Sometimes things go NaN on conversion
    if (isNaN(this.major) || isNaN(this.minor) || isNaN(this.patch)) {
      this.major = VERSION_DEFAULTS.major;
      this.minor = VERSION_DEFAULTS.minor;
      this.patch = VERSION_DEFAULTS.patch;
    }

    return true;
  }
}
