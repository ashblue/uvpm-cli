import { Command } from 'commander';
import { CmdInit } from './init.cmd';
import { StubInquirer } from '../../../shared/stubs/stub-inquirer';
import * as fs from 'fs';

import * as chai from 'chai';
import { IUvpmConfig } from '../../../shared/interfaces/uvpm/config/i-uvpm-config';
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

    xit('should generate default values if blank answers are provided', () => {
      console.log('placeholder');
    });

    xit('should provide help text when the command first runs', () => {
      console.log('placeholder');
    });

    xit('should display the generated file to the user and location after prompts', () => {
      console.log('placeholder');
    });

    xit('should create the file if the user verifies with a yes command', () => {
      console.log('placeholder');
    });

    xit('should abort and not create a file if the user does not confirm without a yes', () => {
      console.log('placeholder');
    });

    xit('should fail if a uvpm.json file already exists', () => {
      console.log('placeholder');
    });
  });
});