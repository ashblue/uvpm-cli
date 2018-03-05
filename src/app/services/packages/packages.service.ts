import { IPackage } from '../../shared/interfaces/packages/i-package';
import axios, { AxiosRequestConfig } from 'axios';
import { ModelProfile } from '../../models/profile/profile.model';

export class ServicePackages {
  constructor (private profile: ModelProfile) {
  }

  public create (data: IPackage): Promise<IPackage> {
    return new Promise<IPackage>((resolve, reject) => {
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

  public get (name: string): Promise<IPackage> {
    return new Promise<IPackage>((resolve, reject) => {
      let httpConfig: AxiosRequestConfig = {};
      if (this.profile.isLoggedIn) {
        httpConfig = {
          headers: {
            Authorization: `Bearer ${this.profile.token}`,
          },
        };
      }

      axios.get(`${this.profile.server}/api/v1/packages/${name}`, httpConfig)
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

  public delete (name: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      axios.delete(`${this.profile.server}/api/v1/packages/${name}`, {
        headers: {
          Authorization: `Bearer ${this.profile.token}`,
        },
      })
        .then(() => {
          resolve();
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
}
