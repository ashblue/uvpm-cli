import { IPackage } from '../../shared/interfaces/packages/i-package';
import axios from 'axios';
import { ModelProfile } from '../../models/profile/profile.model';
import { IPackageSearchResult } from '../../shared/interfaces/packages/i-package-search-result';
import { ServiceAxios } from '../axios/axios.service';

export class ServicePackages {
  constructor (
    private profile: ModelProfile,
    private axiosService: ServiceAxios,
  ) {
  }

  public create (data: IPackage): Promise<IPackage> {
    return new Promise<IPackage>((resolve, reject) => {
      axios.post(`${this.profile.server}/api/v1/packages`, data, this.axiosService.getHttpConfig())
        .then((response) => {
          resolve(response.data as IPackage);
        })
        .catch((err) => this.axiosService.handleError(err, reject));
    });
  }

  public get (name: string): Promise<IPackage> {
    return new Promise<IPackage>((resolve, reject) => {
      axios.get(`${this.profile.server}/api/v1/packages/${name}`, this.axiosService.getHttpConfig())
        .then((response) => {
          resolve(response.data as IPackage);
        })
        .catch((err) => this.axiosService.handleError(err, reject));
    });
  }

  public delete (name: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      axios.delete(`${this.profile.server}/api/v1/packages/${name}`, this.axiosService.getHttpConfig())
        .then(() => {
          resolve();
        })
        .catch((err) => this.axiosService.handleError(err, reject));
    });
  }

  public search (name: string): Promise<IPackageSearchResult[]> {
    return new Promise<IPackageSearchResult[]>((resolve, reject) => {
      axios.get(`${this.profile.server}/api/v1/packages/search/${name}`, this.axiosService.getHttpConfig())
        .then((response) => {
          resolve(response.data as IPackageSearchResult[]);
        })
        .catch((err) => this.axiosService.handleError(err, reject));
    });
  }
}
