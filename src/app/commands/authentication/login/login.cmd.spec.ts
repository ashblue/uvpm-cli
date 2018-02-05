import * as chai from 'chai';
import { CmdLogin } from './login.cmd';
import { Command } from 'commander';
import { StubInquirer } from '../../../shared/stubs/stub-inquirer';

const expect = chai.expect;

describe('CmdLogin', () => {
  it('should initialize', () => {
    const cmd = new CmdLogin(new Command(), new StubInquirer() as any);
    expect(cmd).to.be.ok;
  });

  it('should run the command', () => {
    const cmd = new CmdLogin(new Command(), new StubInquirer() as any);
    cmd.action();
  });
});
