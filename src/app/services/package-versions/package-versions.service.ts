import { ModelProfile } from '../../models/profile/profile.model';
import { IPackageVersion } from '../../shared/interfaces/packages/versions/i-package-version';
import axios from 'axios';
import * as tmp from 'tmp';
import * as fs from 'fs';
import * as http from 'http';
import { ServiceAxios } from '../axios/axios.service';

export class ServicePackageVersions {
  constructor (
    private profile: ModelProfile,
    private axiosService: ServiceAxios,
  ) {
  }

  public add (packageName: string, version: IPackageVersion): Promise<IPackageVersion> {
    return new Promise<IPackageVersion>((resolve, reject) => {
      const url = `${this.profile.server}/api/v1/packages/${packageName}/versions`;
      axios.post(url, version, this.axiosService.getHttpConfig())
        .then((response) => {
          resolve(response.data as IPackageVersion);
        })
        .catch((err) => this.axiosService.handleError(err, reject));
    });
  }

  public get (packageName: string, version: string): Promise<IPackageVersion> {
    return new Promise<IPackageVersion>((resolve, reject) => {
      const url = `${this.profile.server}/api/v1/packages/${packageName}/versions/${version}`;
      axios.get(url, this.axiosService.getHttpConfig())
        .then((response) => {
          resolve(response.data as IPackageVersion);
        })
        .catch((err) => this.axiosService.handleError(err, reject));
    });
  }

  public delete (packageName: string, version: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const url = `${this.profile.server}/api/v1/packages/${packageName}/versions/${version}`;
      axios.delete(url, this.axiosService.getHttpConfig())
        .then(() => {
          resolve();
        })
        .catch((err) => this.axiosService.handleError(err, reject));
    });
  }

  public downloadArchive (packageName: string, version: string): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      let packageData: IPackageVersion;
      try {
        packageData = await this.get(packageName, version);
      } catch (err) {
        reject(err);
        return;
      }

      const tmpFile = tmp.fileSync();

      const file = fs.createWriteStream(tmpFile.name);
      http.get(`${this.profile.server}/${packageData.archive}`, (response) => {
        response.pipe(file);
      }).on('error', (err) => {
        reject(err);
      });

      file.on('close', () => {
        resolve(tmpFile.name);
      });
    });
  }
}
