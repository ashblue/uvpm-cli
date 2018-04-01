import { appConfig } from '../../shared/config';
import Database = PouchDB.Database;
import * as fs from 'fs';
import rimraf = require('rimraf');

const PouchDB = require('pouchdb-node');

export const databaseConfig = {
  DB_FOLDER: '.db',
  DB_FOLDER_TEST: '.db-test',
  PROFILE_FOLDER: 'profiles',
  CACHE_FOLDER: 'cache',
};

Object.freeze(databaseConfig);

export class ServiceDatabase {
  public profile: Database;
  public cache: Database;

  private _dbCreatedCount = 0;

  public static get profilePath () {
    return `${ServiceDatabase.databasePath}/${databaseConfig.PROFILE_FOLDER}`;
  }

  public static get cachePath () {
    return `${ServiceDatabase.databasePath}/${databaseConfig.CACHE_FOLDER}`;
  }

  public static get databasePath () {
    return `${appConfig.folderRoot}/${this.dbId}`;
  }

  private static get dbId () {
    /* istanbul ignore else */
    if (appConfig.isEnvTest) {
      return databaseConfig.DB_FOLDER_TEST;
    }

    /* istanbul ignore next */
    return databaseConfig.DB_FOLDER;
  }

  constructor () {
    if (!fs.existsSync(ServiceDatabase.databasePath)) {
      fs.mkdirSync(ServiceDatabase.databasePath);
    }

    PouchDB.on('created', () => {
      this._dbCreatedCount += 1;
    });

    this.profile = new PouchDB(ServiceDatabase.profilePath);
    this.cache = new PouchDB(ServiceDatabase.cachePath);
  }

  /**
   * Vital for any task that requires database file detection since files are only written
   * after the `created` event is fired
   * @returns {Promise<void>}
   */
  public onReady (): Promise<void> {
    return new Promise<void>((resolve) => {
      PouchDB.on('created', () => {
        if (this._dbCreatedCount === 2) {
          resolve();
        }
      });
    });
  }

  public async destroy () {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await this.profile.destroy();
        await this.cache.destroy();
        rimraf.sync(ServiceDatabase.databasePath);
      } catch (err) {
        reject(err);
        return;
      }

      resolve();
    });
  }
}
