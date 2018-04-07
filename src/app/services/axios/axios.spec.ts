import { expect } from 'chai';
import { ModelProfile } from '../../models/profile/profile.model';
import { ServiceDatabase } from '../database/database.service';
import { ServiceAxios } from '../axios/axios.service';
import { AxiosRequestConfig } from 'axios';

describe('AxiosService', () => {
  let modelProfile: ModelProfile;
  let serviceDatabase: ServiceDatabase;
  let axiosService: ServiceAxios;

  beforeEach(() => {
    serviceDatabase = new ServiceDatabase();
    modelProfile = new ModelProfile(serviceDatabase);
    axiosService = new ServiceAxios(modelProfile);
  });

  it('should initialize', () => {
    expect(axiosService).to.be.ok;
  });

  describe('getHttpConfig', () => {
    it('should add the http header Authorization if logged in', () => {
      modelProfile.email = 'asdf@asdf.com';
      modelProfile.token = '12345';

      const expectedResult: AxiosRequestConfig = {
        headers: {
          Authorization: `Bearer ${modelProfile.token}`,
        },
      };

      const result = axiosService.getHttpConfig();

      expect(result).to.deep.eq(expectedResult);
    });

    it('should not add the http header Authorization if logged out', () => {
      const result = axiosService.getHttpConfig();

      expect(result).to.deep.eq({});
    });
  });
});
