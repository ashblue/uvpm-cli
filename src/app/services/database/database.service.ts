import { config } from '../../shared/config';
import Database = PouchDB.Database;
import * as fs from 'fs';

const PouchDB = require('pouchdb-node');

export const databaseConfig = {
  DB_FOLDER: '.db',
  DB_FOLDER_TEST: '.db-test',
  PROFILE_FOLDER: 'profiles',
  PACKAGE_VERSION_CACHE_FOLDER: 'package-version-cache',
};

Object.freeze(databaseConfig);

export class ServiceDatabase {
  public profile: Database;
  public packageVersionCache: Database;

  public static get profilePath () {
    return `${ServiceDatabase.databasePath}/${databaseConfig.PROFILE_FOLDER}`;
  }

  public static get cachePath () {
    return `${ServiceDatabase.databasePath}/${databaseConfig.PACKAGE_VERSION_CACHE_FOLDER}`;
  }

  public static get databasePath () {
    return `${config.folderRoot}/${this.dbId}`;
  }

  private static get dbId () {
    /* istanbul ignore else */
    if (config.isEnvTest) {
      return databaseConfig.DB_FOLDER_TEST;
    }

    /* istanbul ignore next */
    return databaseConfig.DB_FOLDER;
  }

  constructor () {
    if (!fs.existsSync(ServiceDatabase.databasePath)) {
      fs.mkdirSync(ServiceDatabase.databasePath);
    }

    this.profile = new PouchDB(ServiceDatabase.profilePath);
    this.packageVersionCache = new PouchDB(ServiceDatabase.cachePath);
  }

  public destroy (): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      Promise.all([this.profile.destroy(), this.packageVersionCache.destroy()])
        .then(() => {
          return new Promise ((resolve2, reject2) => {
            fs.rmdir(ServiceDatabase.databasePath, (err) => {
              if (err) {
                reject2(err);
                return;
              }

              resolve2();
            });
          });
        }, reject)
        .then(() => resolve())
        .catch(reject);
    });
  }
}
