import * as chai from 'chai';
import { App } from './app';
const expect = chai.expect;

describe('App', () => {
  it('should initialize', () => {
    const inst = new App();

    expect(inst).to.be.ok;
  });

  describe('init', () => {
    it('should run', async () => {
      const inst = new App();
      await inst.init();
    });
  });
});
