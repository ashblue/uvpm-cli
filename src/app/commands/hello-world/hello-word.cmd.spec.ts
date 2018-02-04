import { CmdHelloWord } from './hello-world.cmd';
import { Command } from 'commander';
import * as inquirer from 'inquirer';

import sinon = require('sinon');
import * as chai from 'chai';
const expect = chai.expect;

describe('CtrlHelloWorld', () => {
  it('should initialize', () => {
    const inst = new CmdHelloWord(new Command(), inquirer);

    expect(inst).to.be.ok;
  });

  it('should run the hello world command', async () => {
    const cmd = new Command();
    const inst = new CmdHelloWord(cmd, inquirer);
    const logSpy = sinon.spy(console, 'log');

    await inst.action();

    expect(inst).to.be.ok;
    expect(logSpy.lastCall.args[0]).to.contain('Hello World!');

    logSpy.restore();
  });
});
