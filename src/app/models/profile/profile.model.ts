import { IProfile } from '../../shared/interfaces/profiles/i-profile';
import Database = PouchDB.Database;
import { ServiceDatabase } from '../../services/database/database.service';

/**
 * @TODO This should be broken up into a service (database portion) and model (data structure, helpers, and constructor)
 */
export class ModelProfile implements IProfile {
  public static profileId = 'default';

  public token: string|null = null;
  public server: string|null = null;
  public email: string|null = null;

  private db: Database;
  private rev: any;

  get isLoggedIn (): boolean {
    return this.isEmail && this.isToken;
  }

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

  get isEmail (): boolean {
    return this.email !== ''
      && this.email !== null
      && this.email !== undefined;
  }

  constructor (serviceDb: ServiceDatabase) {
    this.db = serviceDb.profile;
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
    this.token = null;
    this.server = null;
    this.email = null;

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
