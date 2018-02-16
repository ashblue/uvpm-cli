import { ModelPackageVersionCache } from './package-version-cache.model';
import * as chai from 'chai';

const expect = chai.expect;

describe('ModelPackageVersionCache', () => {
  it('should initialize', () => {
    const m = new ModelPackageVersionCache();
    expect(m).to.be.ok;
  });
});
