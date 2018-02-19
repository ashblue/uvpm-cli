import * as chai from 'chai';
import { ExampleProject } from './example-project';
import * as fs from 'fs';
import { IUvpmConfig } from '../../interfaces/uvpm/config/i-uvpm-config';

const expect = chai.expect;

describe('ExampleProject', () => {
  const defaultConfig: IUvpmConfig = {
    version: '1.0.0',
    name: 'example',
  };

  it('should initialize', () => {
    const example = new ExampleProject(defaultConfig);

    expect(example).to.be.ok;
  });

  describe('createProject', () => {
    it('should use the uvpm.json package name as the folder root name', () => {
      const example = new ExampleProject(defaultConfig);
      const path = `${example.root}`;

      example.createProject();

      expect(example).to.be.ok;
      expect(fs.existsSync(path)).to.be.ok;
    });

    it('should spawn a uvpm.json file in the root', () => {
      const example = new ExampleProject(defaultConfig);
      const path = `${example.root}/uvpm.json`;

      example.createProject();

      expect(example).to.be.ok;
      expect(fs.existsSync(path)).to.be.ok;
    });
  });

  xit('should turn a list of files, paths, and content into a hierarchy', () => {
    console.log('placeholder');
  });
});
