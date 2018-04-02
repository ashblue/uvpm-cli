import { expect } from 'chai';
import { CmdUninstall } from './uninstall.cmd';
import { A } from '../../../shared/tests/builder/a';
import { SinonStub } from 'sinon';
import * as sinon from 'sinon';
import { ModelUvpmConfig } from '../../../models/uvpm/uvpm-config.model';
import { ModelProfile } from '../../../models/profile/profile.model';
import { ServiceDatabase } from '../../../services/database/database.service';
import { ExampleProjectUnity } from '../../../shared/tests/example-project/unity/example-project-unity';
import * as tar from 'tar';
import * as fs from 'fs';
import mkdirp = require('mkdirp');
import { Command } from 'commander';
import { CmdInstall } from '../install/install.cmd';

describe('CmdUninstall', () => {
  const packageName = 'my-package';

  let cmd: CmdUninstall;
  let db: ServiceDatabase;
  let config: ModelUvpmConfig;
  let profile: ModelProfile;
  let program: Command;

  let unityProject: ExampleProjectUnity;

  let stubIsFile: SinonStub;
  let stubFileRoot: SinonStub;
  let stubConfigSave: SinonStub;

  beforeEach(() => {
    config = new ModelUvpmConfig();
    config.name = 'my-project';

    db = new ServiceDatabase();

    program = new Command();

    profile = new ModelProfile(db);
    profile.server = 'http://uvpm.com';
    profile.email = 'asdf@asdf.com';
    profile.token = '34l2j3jkl@34jkkj3';

    cmd = A.command()
      .withModelUvpmConfig(config)
      .withServiceDatabase(db)
      .withModelProfile(profile)
      .withCommanderProgram(program)
      .build(CmdUninstall);
  });

  beforeEach(async () => {
    unityProject = await A.unityPackage().build();

    stubFileRoot = sinon.stub(CmdUninstall.prototype, 'fileRoot' as any)
      .get(() => unityProject.root);

    stubIsFile = sinon.stub(config, 'isFile')
      .get(() => true);

    stubConfigSave = sinon.stub(config, 'save');
  });

  afterEach(async () => {
    stubFileRoot.restore();
    await unityProject.deleteProject();
  });

  async function savePackage (packName: string) {
    const outputLocation = `${unityProject.root}/${config.dependencies.outputFolder}/${packName}`;
    const installedPackage = await A.unityPackage()
      .withName(packName)
      .build();

    config.dependencies.packages.push({
      name: packName,
      version: installedPackage.config.version.toString(),
    });

    mkdirp.sync(outputLocation);
    await tar.extract({
      file: installedPackage.archive,
      cwd: outputLocation,
    });
  }

  describe('missing data failures', () => {
    it('should fail if a uvpm.json file is not present', async () => {
      const errMsg = 'Please create a uvpm.json file';

      stubIsFile.get(() => false);
      await cmd.action();

      expect(cmd.logError.lastEntry).to.contain(errMsg);
    });

    it('should fail if a server has not been set', async () => {
      const errMsg = 'Please set a server before using this action';

      profile.server = null;
      await cmd.action();

      expect(cmd.logError.lastEntry).to.contain(errMsg);
    });

    it('should fail if the user is not logged in', async () => {
      const errMsg = 'Please login before using this action';

      profile.email = undefined as any;
      profile.token = undefined as any;
      await cmd.action();

      expect(cmd.logError.lastEntry).to.contain(errMsg);
    });
  });

  describe('uninstall [package]', () => {
    it('should error if there is no package to uninstall', async () => {
      await cmd.action(packageName);

      expect(cmd.logError.lastEntry).to.eq(`Package "${packageName}" could not be found to uninstall`);
    });

    describe('with package installed', () => {
      beforeEach(async () => {
        await savePackage(packageName);
      });

      it('should remove the package uninstalled', async () => {
        const outputLocation = `${unityProject.root}/${config.dependencies.outputFolder}/${packageName}`;

        await cmd.action(packageName);

        expect(fs.existsSync(`${outputLocation}`)).to.not.be.ok;
      });

      it('should print a success message when complete', async () => {
        await cmd.action(packageName);

        expect(cmd.logSuccess.lastEntry).to.eq(`Package "${packageName}" uninstalled`);
      });

      it('should not save the config file', async () => {
        await cmd.action(packageName);

        expect(stubConfigSave.called).to.eq(false);
      });

      it('should not remove the package from the config file', async () => {
        await cmd.action(packageName);

        expect(config.dependencies.packages.find((p) => p.name === packageName)).to.be.ok;
      });

      describe('flag --save', () => {
        beforeEach(async () => {
          program.save = true;
        });

        it('should remove the package from the config file', async () => {
          await cmd.action(packageName);

          expect(config.dependencies.packages.find((p) => p.name === packageName)).to.not.be.ok;
        });

        it('should save the config file', async () => {
          await cmd.action(packageName);

          expect(stubConfigSave.called).to.eq(true);
        });

        it('should print a message that the uvpm.json file is updated', async () => {
          await cmd.action(packageName);

          expect(cmd.log.history).to.contain('uvpm.json file successfully updated');
        });

        it('should print a message that a re-install is triggering', async () => {
          await cmd.action(packageName);

          expect(cmd.log.history).to.contain('Updating installed dependencies...');
        });

        it('should trigger a full re-install via the install command', async () => {
          const spyCmdInstallAction = sinon.stub(CmdInstall.prototype, 'action').callsFake(() => {
            return new Promise((resolve) => resolve());
          });

          await cmd.action(packageName);

          spyCmdInstallAction.restore();

          expect(spyCmdInstallAction.calledWith()).to.eq(true);
        });
      });
    });
  });

  describe('uninstall', () => {
    it('should delete all packages', async () => {
      const outputLocation = `${unityProject.root}/${config.dependencies.outputFolder}`;

      await savePackage(packageName);
      await cmd.action();

      expect(fs.readdirSync(outputLocation).length).to.eq(0);
    });

    it('should should not crash if run without a package being installed', async () => {
      await cmd.action();
    });

    it('should print a success message', async () => {
      await savePackage(packageName);
      await cmd.action();

      expect(cmd.logSuccess.lastEntry).to.contain('All packages successfully uninstalled');
    });
  });
});
