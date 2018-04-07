import { ModelProfile } from '../../models/profile/profile.model';
import { AxiosRequestConfig } from 'axios';

export class ServiceAxios {
  constructor (private profile: ModelProfile) {
  }

  /**
   * Generate HTTP config with proper login credentials
   * @returns {AxiosRequestConfig}
   */
  public getHttpConfig (): AxiosRequestConfig {
    let httpConfig: AxiosRequestConfig = {};
    if (this.profile.isLoggedIn) {
      httpConfig = {
        headers: {
          Authorization: `Bearer ${this.profile.token}`,
        },
      };
    }

    return httpConfig;
  }

  /**
   * Handle errors in a way friendly to Axios
   */
  public handleError (err: any, reject: (reason?: any) => void) {
    if (err && err.response && err.response.data) {
      reject(err.response.data);
      return;
    }

    reject(err);
  }
}
