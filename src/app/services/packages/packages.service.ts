import { IPackage } from '../../shared/interfaces/packages/i-package';
import axios from 'axios';
import { ModelProfile } from '../../models/profile/profile.model';

export class ServicePackages {
  constructor (private profile: ModelProfile) {
  }

  public create (data: IPackage): Promise<IPackage> {
    return new Promise<IPackage>((resolve, reject) => {
      if (!this.profile.isToken) {
        reject('You must be logged in to do that');
        return;
      }

      if (!this.profile.isServer) {
        reject('Please set a server to run create');
        return;
      }

      axios.post(`${this.profile.server}/api/v1/packages`, data, {
        headers: {
          Authorization: `Bearer ${this.profile.token}`,
        },
      })
        .then((response) => {
          resolve(response.data as IPackage);
        })
        .catch((err) => {
          if (err && err.response && err.response.data) {
            reject(err.response.data);
            return;
          }

          reject(err);
        });
    });
  }

  // public get (name: string): Promise<IPackage> {
  // }
  //
  // public delete (name: string): Promise<void> {
  // }
}
