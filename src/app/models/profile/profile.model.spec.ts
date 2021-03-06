import * as chai from 'chai';
import { ModelProfile } from './profile.model';
import { IProfile } from '../../shared/interfaces/profiles/i-profile';
import { ServiceDatabase } from '../../services/database/database.service';

const expect = chai.expect;

describe('ModelProfile', () => {
  it('should initialize', () => {
    const model = new ModelProfile(new ServiceDatabase());

    expect(model).to.be.ok;
  });

  describe('when initialized', () => {
    let profile: ModelProfile;

    beforeEach(() => {
      profile = new ModelProfile(new ServiceDatabase());
    });

    describe('save', () => {
      it('should write settings to storage', async () => {
        profile.email = 'asdf@asdf.com';
        profile.server = 'http://asdf.com';
        profile.token = 'asdfjlk23j42l@#$@kjdsfjk';

        await profile.save();

        const db = new ServiceDatabase().profile;
        const result: IProfile = await db.get<IProfile>(ModelProfile.profileId);

        expect(result._id).to.eq(ModelProfile.profileId);
        expect(result.email).to.eq(profile.email);
        expect(result.server).to.eq(profile.server);
        expect(result.token).to.eq(profile.token);
      });
    });

    describe('load', () => {
      it('should do nothing if there is no profile', async () => {
        const email = 'asdf@asdf.com';
        const server = 'http://asdf.com';
        const token = 'asdfjlk23j42l@#$@kjdsfjk';

        profile.email = email;
        profile.server = server;
        profile.token = token;

        await profile.load();

        expect(profile.email).to.eq(email);
        expect(profile.server).to.eq(server);
        expect(profile.token).to.eq(token);
      });

      it('should overwrite the profile with saved data', async () => {
        const email = 'asdf@asdf.com';
        const server = 'http://asdf.com';
        const token = 'asdfjlk23j42l@#$@kjdsfjk';

        profile.email = email;
        profile.server = server;
        profile.token = token;

        await profile.save();

        profile.email = '';
        profile.server = '';
        profile.token = '';

        await profile.load();

        expect(profile.email).to.eq(email);
        expect(profile.server).to.eq(server);
        expect(profile.token).to.eq(token);
      });
    });

    describe('clear', () => {
      it('should not crash if there is nothing to clear', async () => {
        await profile.clear();
      });

      it('should wipe all data from the model', async () => {
        profile.email = 'asdf@asdf.com';
        profile.server = 'http://asdf.com';
        profile.token = 'asdfjlk23j42l@#$@kjdsfjk';

        await profile.clear();

        expect(profile.email).to.eq(null);
        expect(profile.server).to.eq(null);
        expect(profile.token).to.eq(null);
      });

      it('should wipe all data from storage', async () => {
        profile.email = 'asdf@asdf.com';
        profile.server = 'http://asdf.com';
        profile.token = 'asdfjlk23j42l@#$@kjdsfjk';

        await profile.save();
        await profile.clear();
        await profile.load();

        expect(profile.email).to.eq(null);
        expect(profile.server).to.eq(null);
        expect(profile.token).to.eq(null);
      });
    });
  });
});
