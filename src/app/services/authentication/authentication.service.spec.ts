import { expect } from 'chai';
import { ServiceAuthentication } from './authentication.service';
import { ModelProfile } from '../../models/profile/profile.model';
import { ServiceDatabase } from '../database/database.service';
import { IUserRegister } from '../../shared/interfaces/user/i-user-register';
import { IUser } from '../../shared/interfaces/user/i-user';
import nock = require('nock');
import { ServiceAxios } from '../axios/axios.service';

describe('ServiceAuthentication', () => {
  let serviceAuthentication: ServiceAuthentication;
  let modelProfile: ModelProfile;
  let serviceDatabase: ServiceDatabase;
  let axiosService: ServiceAxios;

  beforeEach(() => {
    serviceDatabase = new ServiceDatabase();
    modelProfile = new ModelProfile(serviceDatabase);
    axiosService = new ServiceAxios(modelProfile);
    serviceAuthentication = new ServiceAuthentication(modelProfile, axiosService);
  });

  it('should initialize', () => {
    expect(serviceAuthentication).to.be.ok;
  });

  describe('createUser', () => {
    const server = 'http://uvpm.com';
    let newUser: IUserRegister;

    beforeEach(() => {
      modelProfile.server = server;

      newUser = {
        name: 'New User',
        email: 'asdf@asdf.com',
        password: 'asdfasdf1',
      };
    });

    it('should send a request to the API', async () => {
      const response: IUser = {
        name: newUser.name,
        email: newUser.email,
      };

      nock(server)
        .post('/api/v1/users')
        .reply(200, response);

      const result = await serviceAuthentication.register(newUser);

      expect(result).to.deep.eq(response);
    });

    it('should send a header token in the API request if logged in', async () => {
      const response: IUser = {
        name: newUser.name,
        email: newUser.email,
      };

      modelProfile.token = '12345';
      modelProfile.email = 'asdf@asdf.com';
      nock(server)
        .matchHeader('Authorization', `Bearer ${modelProfile.token}`)
        .post('/api/v1/users')
        .reply(200, response);

      const result = await serviceAuthentication.register(newUser);

      expect(result).to.deep.eq(response);
    });

    it('should fail with an http error code', async () => {
      const errMsg = 'Internal server error';

      nock(server)
        .post('/api/v1/users')
        .reply(500, errMsg);

      let err: any = null;
      try {
        await serviceAuthentication.register(newUser);
      } catch (e) {
        err = e;
      }

      console.log(err);

      expect(err).to.deep.eq(errMsg);
    });
  });
});
