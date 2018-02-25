import { ModelProfile } from '../../models/profile/profile.model';
import { IPackageVersion } from '../../shared/interfaces/packages/versions/i-package-version';
import axios from 'axios';

export class ServicePackageVersions {
  constructor (private profile: ModelProfile) {
  }

  public add (packageName: string, version: IPackageVersion): Promise<IPackageVersion> {
    return new Promise<IPackageVersion>((resolve, reject) => {
      axios.post(`${this.profile.server}/api/v1/packages/${packageName}/versions`, version, {
        headers: {
          Authorization: `Bearer ${this.profile.token}`,
        },
      })
        .then((response) => {
          resolve(response.data as IPackageVersion);
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

  // public get (packageName: string, version: string): Promise<IPackageVersion> {
  //
  // }
  //
  // public delete (packageName: string, version: string): Promise<void> {
  //
  // }
}
