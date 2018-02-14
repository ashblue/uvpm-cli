import { Command } from 'commander';
import { CmdInit } from './init.cmd';
import { StubInquirer } from '../../../shared/stubs/stub-inquirer';
import { IUvpmConfig } from '../../../shared/interfaces/uvpm/config/i-uvpm-config';
import { configDefaults, ModelUvpmConfig } from '../../../models/uvpm/uvpm-config.model';

import * as fs from 'fs';
import * as chai from 'chai';
import { ModelVersion } from '../../../models/version/version.model';
import { ServiceDatabase } from '../../../services/database/database.service';

const expect = chai.expect;

describe('CmdInit', () => {
  it('should initialize', () => {
    const cmdInit = new CmdInit(new ServiceDatabase(), new Command(), new StubInquirer() as any);

    expect(cmdInit).to.be.ok;
  });

  describe('when run', () => {
    let cmd: Command;

    beforeEach(() => {
      cmd = new Command();
    });

    afterEach(() => {
      if (fs.existsSync(`./${ModelUvpmConfig.fileName}`)) {
        fs.unlinkSync(`./${ModelUvpmConfig.fileName}`);
      }
    });

    it('should generate a file based upon answers', async () => {
      const answers = {
        name: 'Unity Animator Helpers',
        version: '2.0.0',
        description: 'My custom description here',
        author: 'Ash Blue',
        license: 'None',
      };

      const cmdInit = new CmdInit(new ServiceDatabase(), cmd, new StubInquirer(answers) as any);
      expect(cmdInit).to.be.ok;
      await cmdInit.action();

      const contents = fs.readFileSync(`./${ModelUvpmConfig.fileName}`);
      expect(contents).to.be.ok;

      const configData = JSON.parse(contents.toString()) as IUvpmConfig;
      expect(configData).to.be.ok;
      expect(configData.name).to.contain(answers.name);
      expect(configData.version).to.eq(answers.version);
      expect(configData.description).to.contain(answers.description);
      expect(configData.author).to.contain(answers.author);
      expect(configData.license).to.contain(answers.license);
    });

    it('should generate default values if blank answers are provided', async () => {
      const answers = {
        name: null,
        version: '',
        description: null,
        author: undefined,
        license: undefined,
      };

      const cmdInit = new CmdInit(new ServiceDatabase(), cmd, new StubInquirer(answers) as any);
      expect(cmdInit).to.be.ok;
      await cmdInit.action();

      const contents = fs.readFileSync(`./${ModelUvpmConfig.fileName}`);
      expect(contents).to.be.ok;

      const configData = JSON.parse(contents.toString()) as IUvpmConfig;
      configData.version = new ModelVersion(configData.version as string);

      expect(configData).to.be.ok;
      expect(configData.name).to.eq(configDefaults.name);
      expect(configData.version.toString()).to.eq(configDefaults.version);
      expect(configData.description).to.eq(configDefaults.description);
      expect(configData.author).to.eq(configDefaults.author);
      expect(configData.license).to.eq(configDefaults.license);
    });

    it('should generate a standard version number if an invalid one is provided', async () => {
      const answers = {
        name: null,
        version: 'asdf',
        description: null,
        author: undefined,
        license: undefined,
      };

      const cmdInit = new CmdInit(new ServiceDatabase(), cmd, new StubInquirer(answers) as any);
      await cmdInit.action();
      const contents = fs.readFileSync(`./${ModelUvpmConfig.fileName}`);
      const configData = JSON.parse(contents.toString()) as IUvpmConfig;

      expect(configData).to.be.ok;
      expect(configData.version).to.be.ok;
      expect(configData.version).to.eq(configDefaults.version.toString());
    });

    it('should fail if a uvpm.json file already exists', async () => {
      fs.writeFileSync(`./${ModelUvpmConfig.fileName}`, '{}');

      const cmdInit = new CmdInit(new ServiceDatabase(), cmd, new StubInquirer({}) as any);
      expect(cmdInit).to.be.ok;

      await cmdInit.action();

      expect(cmdInit.lastLogErr).to.contain(`Cannot overwrite ${ModelUvpmConfig.fileName}`);

      const contents = fs.readFileSync(`./${ModelUvpmConfig.fileName}`).toString();
      expect(contents).to.be.ok;
      expect(contents).to.eq('{}');
    });
  });
});
