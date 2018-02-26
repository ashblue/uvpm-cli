import * as chai from 'chai';
import { appConfig } from './config';
import * as sinon from 'sinon';

const expect = chai.expect;

describe('CommandCollection', () => {
  it('should export an instance', () => {
    expect(appConfig).to.be.ok;
  });

  describe('getFolderRoot', () => {
    it('should return an NPM global path on success', async () => {
      const pathSuccess = '/versions/node/v9.4.0/lib/node_modules/uvpm-cli';

      const stub = sinon.stub(appConfig, '_getInstalledPath')
        .callsFake(() => {
          return pathSuccess;
        });

      const p = await appConfig.folderRoot;

      expect(stub.called).to.be.ok;
      expect(p).to.eq(pathSuccess);

      stub.restore();
    });

    it('should return the local path to the repo on failure', async () => {
      const stub = sinon.stub(appConfig, '_getInstalledPath')
        .callsFake(() => {
          throw new Error();
        });

      const p = await appConfig.folderRoot;
      const pLastLetters = p.substr(p.length - 8);

      expect(stub.called).to.be.ok;
      expect(p).to.contain('uvpm-cli');
      expect(p).to.not.contain('src/app/shared');
      expect(pLastLetters).to.eq('uvpm-cli');

      stub.restore();
    });
  });
});
