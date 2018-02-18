import * as chai from 'chai';
import { serviceTmp } from './tmp.service';
import * as fs from 'fs';
import * as rimraf from 'rimraf';

const expect = chai.expect;

describe('ServiceTmp', () => {
  beforeEach(() => {
    // Delete global injection of tmp folder
    rimraf.sync(serviceTmp.tmpFolder);
  });

  it('should initialize on import', () => {
    expect(serviceTmp).to.be.ok;
  });

  it('should provide the tmpFolder path', () => {
    expect(serviceTmp.tmpFolder).to.eq('.tmp');
  });

  describe('create', () => {
    it('should create a .tmp folder', () => {
      serviceTmp.create();

      expect(fs.existsSync(serviceTmp.tmpFolder)).to.be.ok;
    });

    it('should overwrite pre-existing content', () => {
      const path = `${serviceTmp.tmpFolder}/hello-world.txt`;

      serviceTmp.create();
      fs.writeFileSync(path, 'Hello world');
      serviceTmp.create();

      expect(fs.existsSync(serviceTmp.tmpFolder)).to.be.ok;
      expect(fs.existsSync(path)).to.not.be.ok;
    });
  });

  describe('clear', () => {
    it('should clear the .tmp folder', () => {
      fs.mkdirSync(serviceTmp.tmpFolder);
      serviceTmp.clear();

      expect(fs.existsSync(serviceTmp.tmpFolder)).to.not.be.ok;
    });

    it('should clear nested content', () => {
      const path = `${serviceTmp.tmpFolder}/hello-world.txt`;

      fs.mkdirSync(serviceTmp.tmpFolder);
      fs.writeFileSync(path, 'Hello world');
      serviceTmp.clear();

      expect(fs.existsSync(serviceTmp.tmpFolder)).to.not.be.ok;
    });

    it('should do nothing if there is no tmp folder', () => {
      serviceTmp.clear();

      expect(fs.existsSync(serviceTmp.tmpFolder)).to.not.be.ok;
    });

    it('should not crash if run 2x in a row', () => {
      fs.mkdirSync(serviceTmp.tmpFolder);

      serviceTmp.clear();
      serviceTmp.clear();

      expect(fs.existsSync(serviceTmp.tmpFolder)).to.not.be.ok;
    });
  });
});
