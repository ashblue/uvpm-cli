import * as chai from 'chai';
import { App } from './app';
const expect = chai.expect;

describe('CtrlHelloWorld', () => {
  it('should initialize', () => {
    const inst = new App();

    expect(inst).to.be.ok;
  });
});
