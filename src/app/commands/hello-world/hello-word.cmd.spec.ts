import { CmdHelloWord } from './hello-world.cmd';
import sinon = require('sinon');
import { Command } from 'commander';

import * as chai from 'chai';
const expect = chai.expect;

describe('CtrlHelloWorld', () => {
  it('should initialize', () => {
    const inst = new CmdHelloWord(new Command());

    expect(inst).to.be.ok;
  });

  it('should run the hello world command', async () => {
    const cmd = new Command();
    const inst = new CmdHelloWord(cmd);
    const logSpy = sinon.spy(console, 'log');

    cmd.parse(['node', './', 'hello-world']);

    expect(inst).to.be.ok;
    expect(logSpy.lastCall.args[0]).to.contain('Hello World!');

    logSpy.restore();
  });
});
