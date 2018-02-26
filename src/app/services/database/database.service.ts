import { appConfig } from '../../shared/config';
import Database = PouchDB.Database;
import * as fs from 'fs';

const PouchDB = require('pouchdb-node');

export const databaseConfig = {
  DB_FOLDER: '.db',
  DB_FOLDER_TEST: '.db-test',
  PROFILE_FOLDER: 'profiles',
};

Object.freeze(databaseConfig);

export class ServiceDatabase {
  public profile: Database;

  public static get profilePath () {
    return `${ServiceDatabase.databasePath}/${databaseConfig.PROFILE_FOLDER}`;
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

    this.profile = new PouchDB(ServiceDatabase.profilePath);
  }

  public destroy (): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      Promise.all([this.profile.destroy()])
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
