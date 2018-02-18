import { CmdBase } from '../../base/base.cmd';
import { ModelProfile } from '../../../models/profile/profile.model';

export class CmdLogout extends CmdBase {
  get name (): string {
    return 'logout';
  }

  get description (): string {
    return 'Logs out the currently logged in user';
  }

  protected onAction (): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      return this.logOut()
        .then(resolve)
        .catch(reject);
    });
  }

  private logOut (): Promise<void> {
    return new Promise<void>((resolve) => {
      const profile = new ModelProfile(this.db);
      profile.load()
        .then(() => {
          profile.email = null;
          profile.token = null;
          return profile.save();
        })
        .then(() => {
          this.log('Logged out');
          resolve();
        });
    });
  }
}
