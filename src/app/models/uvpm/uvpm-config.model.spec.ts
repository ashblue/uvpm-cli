import { ModelUvpmConfig } from './uvpm-config.model';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as fs from 'fs';

const expect = chai.expect;

describe('ModelUvpmConfig', () => {
  it('should initialize', () => {
    const config = new ModelUvpmConfig();

    expect(config).to.be.ok;
  });

  it('should overwrite default values', () => {
    const overwrite = { name: 'Lorem Ipsum' };
    const config = new ModelUvpmConfig(overwrite);

    expect(config.name).to.eq(overwrite.name);
  });

  describe('isFile', () => {
    it('should verify the config file exists', async () => {
      const m = new ModelUvpmConfig();

      expect(m.isFile).to.not.be.ok;

      await m.save();

      expect(m.isFile).to.be.ok;

      await m.delete();

      expect(m.isFile).to.not.be.ok;
    });
  });

  describe('delete', () => {
    it('should fail if there is nothing to delete', async () => {
      const m = new ModelUvpmConfig();

      let err: any;
      try {
        await m.delete();
      } catch (e) {
        err = e;
      }

      expect(err).to.be.ok;
    });
  });

  describe('save', () => {
    it('should fail is saving twice to the same place', async () => {
      const stub = sinon.stub(fs, 'writeFile');
      // @ts-ignore
      stub.callsFake((file, contents, done) => done('custom error'));
      const m = new ModelUvpmConfig();

      let err: any;
      try {
        await m.save();
      } catch (e) {
        err = e;
      }

      expect(err).to.be.ok;

      stub.restore();
    });
  });

  describe('load', () => {
    it('should load a file with all changed', async () => {
      const versionMajor = 3;
      const name = 'my-package';
      const m = new ModelUvpmConfig();
      const mNew = new ModelUvpmConfig();

      m.version.major = versionMajor;
      m.name = name;

      await m.save();
      await mNew.load();

      expect(mNew.version.major).to.eq(versionMajor);
      expect(mNew.name).to.eq(name);

      await m.delete();
    });

    it('should fail silently if there is no config file', async () => {
      const stub = sinon.stub(ModelUvpmConfig.prototype, 'isFile');
      stub.get(() => {
        return true;
      });

      const m = new ModelUvpmConfig();
      await m.load();

      stub.restore();
    });
  });
});
