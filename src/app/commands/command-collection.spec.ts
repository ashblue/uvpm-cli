import { CommandCollection } from './command-collection';
import * as chai from 'chai';
import * as commander from 'commander';
import * as inquirer from 'inquirer';

const expect = chai.expect;

describe('CommandCollection', () => {
  it('should initialize', () => {
    const col = new CommandCollection(new commander.Command(), inquirer);

    expect(col).to.be.ok;
  });

  describe('generators', () => {
    it('should inject an init command', () => {
      const col = new CommandCollection(new commander.Command(), inquirer);

      const match = col.commandInstances.find((i) => {
        return i.name.toLowerCase().includes('init');
      });

      expect(match).to.be.ok;
    });
  });

  describe('authentication', () => {
    it('should inject a server command', () => {
      const col = new CommandCollection(new commander.Command(), inquirer);

      const match = col.commandInstances.find((i) => {
        return i.name.toLowerCase().includes('server');
      });

      expect(match).to.be.ok;
    });

    it('should inject a login command', () => {
      const col = new CommandCollection(new commander.Command(), inquirer);

      const match = col.commandInstances.find((i) => {
        return i.name.toLowerCase().includes('login');
      });

      expect(match).to.be.ok;
    });

    it('should inject a logout command', () => {
      const col = new CommandCollection(new commander.Command(), inquirer);

      const match = col.commandInstances.find((i) => {
        return i.name.toLowerCase().includes('logout');
      });

      expect(match).to.be.ok;
    });

    it('should inject a whoami command', () => {
      const col = new CommandCollection(new commander.Command(), inquirer);

      const match = col.commandInstances.find((i) => {
        return i.name.toLowerCase().includes('whoami');
      });

      expect(match).to.be.ok;
    });
  });
});
