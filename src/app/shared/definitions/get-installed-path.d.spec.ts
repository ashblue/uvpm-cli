import * as chai from 'chai';
import { getInstalledPath } from 'get-installed-path';

const expect = chai.expect;

describe('get-installed-path definition', () => {
  it('should import getInstalledPath', () => {
    expect(getInstalledPath).to.be.ok;
  });
});
