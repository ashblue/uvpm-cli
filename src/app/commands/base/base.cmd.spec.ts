import { CmdBase } from './base.cmd';
import { ServiceDatabase } from '../../services/database/database.service';
import { ModelProfile } from '../../models/profile/profile.model';
import * as sinon from 'sinon';
import { expect } from 'chai';
import { ModelUvpmConfig } from '../../models/uvpm/uvpm-config.model';
import { ServicePackageVersions } from '../../services/package-versions/package-versions.service';
import { ServicePackages } from '../../services/packages/packages.service';
import { A } from '../../shared/tests/builder/a';
import { ServiceAxios } from '../../services/axios/axios.service';

describe('CmdBase', () => {
  let cmd: CmdExample;
  let db: ServiceDatabase;
  let config: ModelUvpmConfig;
  let profile: ModelProfile;
  let servicePackages: ServicePackages;
  let servicePackageVersions: ServicePackageVersions;

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

    const serviceAxis = new ServiceAxios(profile);
    servicePackages = new ServicePackages(profile, serviceAxis);
    servicePackageVersions = new ServicePackageVersions(profile, serviceAxis);

    cmd = A.command()
      .withServiceDatabase(db)
      .withModelProfile(profile)
      .withModelUvpmConfig(config)
      .withServicePackages(servicePackages)
      .withServicePackageVersions(servicePackageVersions)
      .build(CmdExample);
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

      expect(cmd.logError.lastEntry).to.contain('Please set a server');
    });

    it('should require a login if "requireLogin" is set', async () => {
      const stub = sinon.stub(CmdExample.prototype, 'requireLogin' as any);
      stub.get(() => {
        return true;
      });

      await cmd.action();

      stub.restore();

      expect(cmd.logError.lastEntry).to.contain('Please login');
    });
  });
});
