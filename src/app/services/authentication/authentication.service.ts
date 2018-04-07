import { ModelProfile } from '../../models/profile/profile.model';
import { IUser } from '../../shared/interfaces/user/i-user';
import axios from 'axios';
import { IUserRegister } from '../../shared/interfaces/user/i-user-register';
import { ServiceAxios } from '../axios/axios.service';

export class ServiceAuthentication {
  constructor (
    private profile: ModelProfile,
    private axiosService: ServiceAxios,
  ) {
  }

  public register (user: IUserRegister): Promise<IUser> {
    return new Promise<IUser>((resolve, reject) => {
      axios.post(`${this.profile.server}/api/v1/users`, user, this.axiosService.getHttpConfig())
        .then((response) => {
          resolve(response.data as IUser);
        })
        .catch((err) => this.axiosService.handleError(err, reject));
    });
  }
}
