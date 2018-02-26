import { CmdBase } from './base.cmd';
import { ServiceDatabase } from '../../services/database/database.service';
import { ModelProfile } from '../../models/profile/profile.model';
import * as commander from 'commander';
import * as inquirer from 'inquirer';
import * as sinon from 'sinon';
import { expect } from 'chai';
import { ModelUvpmConfig } from '../../models/uvpm/uvpm-config.model';

describe('CmdBase', () => {
  let cmd: CmdExample;
  let db: ServiceDatabase;
  let config: ModelUvpmConfig;
  let profile: ModelProfile;

  class CmdExample extends CmdBase {
    get name (): string {
      return 'Example command';
    }

    get description (): string {
      return 'Example description';
    }

    protected onAction (): Promise<void> {
      return new Promise<void>((resolve) => resolve());
    }
  }

  beforeEach(async () => {
    db = new ServiceDatabase();
    profile = new ModelProfile(db);
    config = new ModelUvpmConfig();

    cmd = new CmdExample(db, profile, config, new commander.Command(), inquirer);
  });

  it('should initialize', () => {
    expect(cmd).to.be.ok;
  });

  describe('action', () => {
    it('should require a server if "requireServer" is set', async () => {
      const stub = sinon.stub(CmdExample.prototype, 'requireServer' as any);
      stub.get(() => {
        return true;
      });

      await cmd.action();

      stub.restore();

      expect(cmd.lastLogErr).to.contain('Please set a server');
    });

    it('should require a login if "requireLogin" is set', async () => {
      const stub = sinon.stub(CmdExample.prototype, 'requireLogin' as any);
      stub.get(() => {
        return true;
      });

      await cmd.action();

      stub.restore();

      expect(cmd.lastLogErr).to.contain('Please login');
    });
  });
});
