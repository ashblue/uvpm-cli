import { ServiceDatabase } from '../../../services/database/database.service';
import { ICommandNew } from '../../interfaces/command/i-command-new';
import * as inquirer from 'inquirer';
import { ModelProfile } from '../../../models/profile/profile.model';
import { ModelUvpmConfig } from '../../../models/uvpm/uvpm-config.model';
import { ServicePackageVersions } from '../../../services/package-versions/package-versions.service';
import { Command } from 'commander';
import { ServicePackages } from '../../../services/packages/packages.service';
import { ServiceCache } from '../../../services/cache/cache.service';

export class CommandBuilder {
  private _db: ServiceDatabase;
  private _profile: ModelProfile;
  private _config: ModelUvpmConfig;
  private _program: Command;
  private _inq: inquirer.Inquirer;
  private _packages: ServicePackages;
  private _versions: ServicePackageVersions;
  private _cache: ServiceCache;

  // istanbul ignore next
  private get db (): ServiceDatabase {
    if (!this._db) {
      this._db = new ServiceDatabase();
    }

    return this._db;
  }

  // istanbul ignore next
  private get profile (): ModelProfile {
    if (!this._profile) {
      this._profile = new ModelProfile(this.db);
    }

    return this._profile;
  }

  // istanbul ignore next
  private get config (): ModelUvpmConfig {
    if (!this._config) {
      this._config = new ModelUvpmConfig();
    }

    return this._config;
  }

  private get program (): Command {
    if (!this._program) {
      this._program = new Command();
    }

    return this._program;
  }

  private get inquirer (): inquirer.Inquirer {
    if (!this._inq) {
      this._inq = inquirer;
    }

    return this._inq;
  }

  // istanbul ignore next
  private get packages (): ServicePackages {
    if (!this._packages) {
      this._packages = new ServicePackages(this.profile);
    }

    return this._packages;
  }

  // istanbul ignore next
  private get versions (): ServicePackageVersions {
    if (!this._versions) {
      this._versions = new ServicePackageVersions(this.profile);
    }

    return this._versions;
  }

  private get cache (): ServiceCache {
    if (!this._cache) {
      this._cache = new ServiceCache(this.db);
    }

    return this._cache;
  }

  public build (cmd: ICommandNew): any {
    return new cmd(
      this.db,
      this.profile,
      this.config,
      this.program,
      this.inquirer,
      this.packages,
      this.versions,
      this.cache,
    );
  }

  public withServiceDatabase (database: ServiceDatabase) {
    this._db = database;
    return this;
  }

  public withModelProfile (profile: ModelProfile) {
    this._profile = profile;
    return this;
  }

  public withModelUvpmConfig (config: ModelUvpmConfig) {
    this._config = config;
    return this;
  }

  public withCommanderProgram (program: Command) {
    this._program = program;
    return this;
  }

  public withInquirer (inq: inquirer.Inquirer) {
    this._inq = inq;
    return this;
  }

  public withServicePackages (packages: ServicePackages) {
    this._packages = packages;
    return this;
  }

  public withServicePackageVersions (versions: ServicePackageVersions) {
    this._versions = versions;
    return this;
  }

  public withServiceCache (cache: ServiceCache) {
    this._cache = cache;
    return this;
  }
}
