import { ModelUvpmConfig } from './uvpm-config.model';

import * as chai from 'chai';
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
});
