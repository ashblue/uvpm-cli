import * as chai from 'chai';
import { Command } from 'commander';
import { CmdVersion } from './version.cmd';
import * as inquirer from 'inquirer';
import * as sinon from 'sinon';
import { ModelUvpmConfig } from '../../../models/uvpm/uvpm-config.model';
import { SinonStub } from 'sinon';
import { ModelVersion } from '../../../models/version/version.model';
import { ServiceDatabase } from '../../../services/database/database.service';
import { ModelProfile } from '../../../models/profile/profile.model';
import { ServicePackageVersions } from '../../../services/package-versions/package-versions.service';
import { ServicePackages } from '../../../services/packages/packages.service';

const expect = chai.expect;

describe('CmdVersion', () => {
  let db: ServiceDatabase;
  let profile: ModelProfile;
  let config: ModelUvpmConfig;
  let cmd: CmdVersion;
  let servicePackages: ServicePackages;
  let servicePackageVersions: ServicePackageVersions;

  let stubRequireUvpmJson: SinonStub;

  beforeEach(async () => {
    db = new ServiceDatabase();
    profile = new ModelProfile(db);
    config = new ModelUvpmConfig();
    servicePackages = new ServicePackages(profile);
    servicePackageVersions = new ServicePackageVersions(profile);

    stubRequireUvpmJson = sinon.stub(CmdVersion.prototype, 'requireUvpmJson' as any);
    stubRequireUvpmJson.get(() => {
      return false;
    });

    cmd = new CmdVersion(db, profile, config, new Command(), inquirer,
      servicePackages, servicePackageVersions);
  });

  it('should initialize', () => {
    expect(cmd).to.be.ok;
  });

  it('should fail if there is no uvpm.json', async () => {
    const errMsg = `Please create a uvpm.json file via`;
    stubRequireUvpmJson.get(() => {
      return true;
    });

    await cmd.action();

    expect(cmd.lastLogErr).to.contain(errMsg);
  });

  describe('when initialized with uvpm.json and running command', () => {
    let stubUvpmConfig: SinonStub;

    let uvpmConfigModel: ModelUvpmConfig;
    let stubUvpmConfigModelLoad: SinonStub;
    let stubUvpmConfigModelSave: SinonStub;

    beforeEach(() => {
      uvpmConfigModel = new ModelUvpmConfig();
      stubUvpmConfigModelLoad = sinon.stub(uvpmConfigModel, 'load')
        .callsFake(() => {
          return new Promise((resolve) => resolve());
        });
      stubUvpmConfigModelSave = sinon.stub(uvpmConfigModel, 'save')
        .callsFake(() => {
          return new Promise((resolve) => resolve());
        });

      stubUvpmConfig = sinon.stub(cmd, 'uvpmConfig')
        .get(() => {
          return uvpmConfigModel;
        });
    });

    afterEach(() => {
      stubUvpmConfig.restore();
      stubUvpmConfigModelLoad.restore();
      stubUvpmConfigModelSave.restore();
    });

    describe('version', () => {
      it('should print the version from uvpm.json', async () => {
        const packName = 'test';
        const packVersion = '2.1.5';
        const successMsg = `Package ${packName} is on version ${packVersion}`;

        uvpmConfigModel.version = new ModelVersion(packVersion);
        uvpmConfigModel.name = packName;

        await cmd.action();

        expect(stubUvpmConfigModelLoad.called).to.be.ok;
        expect(stubUvpmConfigModelSave.called).to.not.be.ok;
        expect(cmd.lastLog).to.contain(successMsg);
        expect(cmd.lastLogErr).to.be.not.ok;
      });
    });

    describe('version newVersion', () => {
      it('should set the version in uvpm.json', async () => {
        const packName = 'test';
        const packVersion = '2.1.5';
        const packVersionNew = '3.3.4';
        const successMsg = `Package ${packName} version set to ${packVersionNew}`;

        uvpmConfigModel.version = new ModelVersion(packVersion);
        uvpmConfigModel.name = packName;

        await cmd.action(packVersionNew);

        expect(stubUvpmConfigModelLoad.called).to.be.ok;
        expect(stubUvpmConfigModelSave.called).to.be.ok;
        expect(cmd.lastLog).to.eq(successMsg);
      });

      it('should reject an invalidly formatted version', async () => {
        const packVersion = 'asdf';
        const completeMsg = `Cannot set an invalid version. Must be formatted as X.X.X`;

        uvpmConfigModel.version = new ModelVersion(packVersion);

        await cmd.action(packVersion);

        expect(cmd.lastLogErr).to.eq(completeMsg);
      });
    });

    describe('version major', () => {
      it('should increment the major version in uvpm.json', async () => {
        const packName = 'test';
        const packVersion = '2.1.5';
        const packVersionNew = '3.0.0';
        const successMsg = `Package ${packName} version set to ${packVersionNew}`;

        uvpmConfigModel.version = new ModelVersion(packVersion);
        uvpmConfigModel.name = packName;

        await cmd.action('major');

        expect(stubUvpmConfigModelLoad.called).to.be.ok;
        expect(stubUvpmConfigModelSave.called).to.be.ok;
        expect(cmd.lastLog).to.contain(successMsg);
      });
    });

    describe('version minor', () => {
      it('should increment the minor version in uvpm.json', async () => {
        const packName = 'test';
        const packVersion = '2.1.5';
        const packVersionNew = '2.2.0';
        const successMsg = `Package ${packName} version set to ${packVersionNew}`;

        uvpmConfigModel.version = new ModelVersion(packVersion);
        uvpmConfigModel.name = packName;

        await cmd.action('minor');

        expect(stubUvpmConfigModelLoad.called).to.be.ok;
        expect(stubUvpmConfigModelSave.called).to.be.ok;
        expect(cmd.lastLog).to.contain(successMsg);
      });
    });

    describe('version patch', () => {
      it('should increment the patch version in uvpm.json', async () => {
        const packName = 'test';
        const packVersion = '2.1.5';
        const packVersionNew = '2.1.6';
        const successMsg = `Package ${packName} version set to ${packVersionNew}`;

        uvpmConfigModel.version = new ModelVersion(packVersion);
        uvpmConfigModel.name = packName;

        await cmd.action('patch');

        expect(stubUvpmConfigModelLoad.called).to.be.ok;
        expect(stubUvpmConfigModelSave.called).to.be.ok;
        expect(cmd.lastLog).to.contain(successMsg);
      });
    });
  });
});
