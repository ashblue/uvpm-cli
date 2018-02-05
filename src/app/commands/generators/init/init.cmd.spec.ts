import { Command } from 'commander';
import { CmdInit } from './init.cmd';
import { StubInquirer } from '../../../shared/stubs/stub-inquirer';
import { IUvpmConfig } from '../../../shared/interfaces/uvpm/config/i-uvpm-config';
import { configDefaults } from '../../../shared/models/uvpm/uvpm-config.model';

import * as fs from 'fs';
import * as chai from 'chai';

const expect = chai.expect;

describe('CmdInit', () => {
  it('should initialize', () => {
    const cmdInit = new CmdInit(new Command(), new StubInquirer() as any);

    expect(cmdInit).to.be.ok;
  });

  describe('when run', () => {
    let cmd: Command;

    beforeEach(() => {
      cmd = new Command();
    });

    afterEach(() => {
      if (fs.existsSync(`./${CmdInit.fileName}`)) {
        fs.unlinkSync(`./${CmdInit.fileName}`);
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

      const cmdInit = new CmdInit(cmd, new StubInquirer(answers) as any);
      expect(cmdInit).to.be.ok;
      await cmdInit.action();

      const contents = fs.readFileSync(`./${CmdInit.fileName}`);
      expect(contents).to.be.ok;

      const configData = JSON.parse(contents.toString()) as IUvpmConfig;
      expect(configData).to.be.ok;
      expect(configData.name).to.contain(answers.name);
      expect(configData.version).to.contain(answers.version);
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

      const cmdInit = new CmdInit(cmd, new StubInquirer(answers) as any);
      expect(cmdInit).to.be.ok;
      await cmdInit.action();

      const contents = fs.readFileSync(`./${CmdInit.fileName}`);
      expect(contents).to.be.ok;

      const configData = JSON.parse(contents.toString()) as IUvpmConfig;
      expect(configData).to.be.ok;
      expect(configData.name).to.eq(configDefaults.name);
      expect(configData.version).to.eq(configDefaults.version);
      expect(configData.description).to.eq(configDefaults.description);
      expect(configData.author).to.eq(configDefaults.author);
      expect(configData.license).to.eq(configDefaults.license);
    });

    it('should fail if a uvpm.json file already exists', async () => {
      fs.writeFileSync(`./${CmdInit.fileName}`, '{}');

      const cmdInit = new CmdInit(cmd, new StubInquirer({}) as any);
      expect(cmdInit).to.be.ok;

      let err;
      try {
        await cmdInit.action();
      } catch (e) {
        err = e;
      }

      expect(err).to.be.ok;

      const contents = fs.readFileSync(`./${CmdInit.fileName}`).toString();
      expect(contents).to.be.ok;
      expect(contents).to.eq('{}');
    });
  });
});
