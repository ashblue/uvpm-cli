import * as chai from 'chai';
import { Command } from 'commander';
import { CmdVersion } from './version.cmd';
import * as inquirer from 'inquirer';
import * as sinon from 'sinon';
import { ModelUvpmConfig } from '../../../shared/models/uvpm/uvpm-config.model';
import { SinonStub } from 'sinon';
import { ModelVersion } from '../../../shared/models/version/version.model';

const expect = chai.expect;

describe('CmdVersion', () => {
  it('should initialize', () => {
    const cmd = new CmdVersion(new Command(), inquirer);
    expect(cmd).to.be.ok;
  });

  it('should fail if there is no uvpm.json', async () => {
    const cmd = new CmdVersion(new Command(), inquirer);
    const errMsg = `Please create a uvpm.json file via "uvpm init" to run version commands`;
    await cmd.action();

    expect(cmd.lastLogErr).to.eq(errMsg);
  });

  describe('when initialized with uvpm.json and running command', () => {
    let cmdVersion: CmdVersion;
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

      cmdVersion = new CmdVersion(new Command(), inquirer);
      stubUvpmConfig = sinon.stub(cmdVersion, 'uvpmConfig')
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

        await cmdVersion.action();

        expect(stubUvpmConfigModelLoad.called).to.be.ok;
        expect(stubUvpmConfigModelSave.called).to.not.be.ok;
        expect(cmdVersion.lastLog).to.contain(successMsg);
        expect(cmdVersion.lastLogErr).to.be.not.ok;
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

        await cmdVersion.action(packVersionNew);

        expect(stubUvpmConfigModelLoad.called).to.be.ok;
        expect(stubUvpmConfigModelSave.called).to.be.ok;
        expect(cmdVersion.lastLog).to.eq(successMsg);
      });

      it('should reject an invalidly formatted version', async () => {
        const packVersion = 'asdf';
        const completeMsg = `Cannot set an invalid version. Must be formatted as X.X.X`;

        uvpmConfigModel.version = new ModelVersion(packVersion);

        await cmdVersion.action(packVersion);

        expect(cmdVersion.lastLogErr).to.eq(completeMsg);
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

        await cmdVersion.action('major');

        expect(stubUvpmConfigModelLoad.called).to.be.ok;
        expect(stubUvpmConfigModelSave.called).to.be.ok;
        expect(cmdVersion.lastLog).to.contain(successMsg);
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

        await cmdVersion.action('minor');

        expect(stubUvpmConfigModelLoad.called).to.be.ok;
        expect(stubUvpmConfigModelSave.called).to.be.ok;
        expect(cmdVersion.lastLog).to.contain(successMsg);
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

        await cmdVersion.action('patch');

        expect(stubUvpmConfigModelLoad.called).to.be.ok;
        expect(stubUvpmConfigModelSave.called).to.be.ok;
        expect(cmdVersion.lastLog).to.contain(successMsg);
      });
    });
  });
});
