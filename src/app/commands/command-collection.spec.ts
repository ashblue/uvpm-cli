import { CommandCollection } from './command-collection';
import * as chai from 'chai';
import * as commander from 'commander';

const expect = chai.expect;

describe('CommandCollection', () => {
  it('should initialize', () => {
    const col = new CommandCollection(new commander.Command());

    expect(col).to.be.ok;
  });

  it('should trigger the listen method to process arguments', () => {
    const col = new CommandCollection(new commander.Command());
    col.listen();
  });
});
