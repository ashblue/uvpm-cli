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
    it('should convert a string to the model on initialization', () => {
      const major = 4;
      const minor = 2;
      const patch = 3;
      const version = `${major}.${minor}.${patch}`;
      const m = new ModelVersion(version);

      expect(m).to.be.ok;
      expect(m.major).to.eq(major);
      expect(m.minor).to.eq(minor);
      expect(m.patch).to.eq(patch);
    });

    it('should fall back to default if string to conversion fails', () => {
      const m = new ModelVersion('');
      expect(m).to.be.ok;
      expect(m.major).to.eq(1);
      expect(m.minor).to.eq(0);
      expect(m.patch).to.eq(0);
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
