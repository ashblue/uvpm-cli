import { IProfile } from '../../interfaces/profiles/i-profile';
import Database = PouchDB.Database;
const PouchDB = require('pouchdb-node');

export class ModelProfile implements IProfile {
  public static dbName = '.db';
  public static profileId = 'default';

  public token: string = '';
  public server: string = '';
  public email: string = '';

  private db: Database;
  private rev: any;

  get isServer (): boolean {
    return this.server !== ''
      && this.server !== null
      && this.server !== undefined;
  }

  get isToken (): boolean {
    return this.token !== ''
      && this.token !== null
      && this.token !== undefined;
  }

  constructor () {
    this.db = new PouchDB(ModelProfile.dbName);
  }

  public load (): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.db.get<IProfile>(ModelProfile.profileId)
        .then((doc) => {
          Object.assign(this, doc);
          this.rev = doc._rev;
          resolve();
        })
        .catch((err: any) => {
          /* istanbul ignore else: Emergency exit catch */
          if (err.status === 404) {
            resolve();
            return;
          }

          /* istanbul ignore next: Emergency exit catch */
          reject(err);
        });
    });
  }

  public save (): Promise<PouchDB.Core.Response> {
    return this.db.put<IProfile>({
      _id: ModelProfile.profileId,
      _rev: this.rev,
      token: this.token,
      server: this.server,
      email: this.email,
    });
  }

  public clear (): Promise<void> {
    this.token = '';
    this.server = '';
    this.email = '';

    return new Promise<void>((resolve, reject) => {
      this.db.get(ModelProfile.profileId)
        .then((doc) => {
          return this.db.remove(doc);
        })
        .then(() => {
          resolve();
        })
        .catch((err: any) => {
          /* istanbul ignore else: Emergency exit catch */
          if (err.status === 404) {
            resolve();
            return;
          }

          /* istanbul ignore next: Emergency exit catch */
          reject(err);
        });
    });
  }
}
