import { ModelVersion } from './version.model';
import * as chai from 'chai';

const expect = chai.expect;

describe('ModelVersion', () => {
  it('should initialize', () => {
    const m = new ModelVersion();
    expect(m).to.be.ok;
    expect(m.major).to.eq(1);
    expect(m.minor).to.eq(0);
    expect(m.patch).to.eq(0);
  });

  describe('constructor', () => {
    describe('success', () => {
      const major = 4;
      const minor = 2;
      const patch = 3;

      it('should convert a string to the model on initialization', () => {
        const version = `${major}.${minor}.${patch}`;
        const m = new ModelVersion(version);

        expect(m).to.be.ok;
        expect(m.major).to.eq(major);
        expect(m.minor).to.eq(minor);
        expect(m.patch).to.eq(patch);
      });

      it('should remove ^ characters', () => {
        const version = `^${major}.${minor}.${patch}`;
        const m = new ModelVersion(version);

        expect(m).to.be.ok;
        expect(m.major).to.eq(major);
        expect(m.minor).to.eq(minor);
        expect(m.patch).to.eq(patch);
      });

      it('should remove ~ characters', () => {
        const version = `~${major}.${minor}.${patch}`;
        const m = new ModelVersion(version);

        expect(m).to.be.ok;
        expect(m.major).to.eq(major);
        expect(m.minor).to.eq(minor);
        expect(m.patch).to.eq(patch);
      });
    });

    it('should fall back to default if string to conversion fails', () => {
      const m = new ModelVersion('');
      expect(m).to.be.ok;
      expect(m.major).to.eq(1);
      expect(m.minor).to.eq(0);
      expect(m.patch).to.eq(0);
    });
  });

  describe('isVersionNewer', () => {
    it('should detect a greater major version', () => {
      const mNew = new ModelVersion('2.0.0');
      const mOld = new ModelVersion('1.0.0');

      expect(mNew.isNewerVersion(mOld)).to.be.ok;
    });

    it('should fail if identical', () => {
      const mNew = new ModelVersion('1.0.0');
      const mOld = new ModelVersion('1.0.0');

      expect(mNew.isNewerVersion(mOld)).to.not.be.ok;
    });

    it('should a greater minor version', () => {
      const mNew = new ModelVersion('1.1.0');
      const mOld = new ModelVersion('1.0.0');

      expect(mNew.isNewerVersion(mOld)).to.be.ok;
    });

    it('should detect a greater patch', () => {
      const mNew = new ModelVersion('1.0.1');
      const mOld = new ModelVersion('1.0.0');

      expect(mNew.isNewerVersion(mOld)).to.be.ok;
    });
  });

  describe('toString', () => {
    it('should convert to a string', () => {
      const m = new ModelVersion();
      m.major = 5;
      m.minor = 2;
      m.patch = 0;

      const s = m.toString();

      expect(s).to.eq(`${m.major}.${m.minor}.${m.patch}`);
    });
  });

  describe('toJSON', () => {
    it('should convert to a JSON string', () => {
      const m = new ModelVersion();
      m.major = 5;
      m.minor = 2;
      m.patch = 0;

      const formattedString = `${m.major}.${m.minor}.${m.patch}`;

      const json = JSON.stringify(m);
      expect(json).to.eq(`"${formattedString}"`);
    });
  });
});
