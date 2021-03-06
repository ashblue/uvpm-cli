import { ModelProfile } from '../../../models/profile/profile.model';
import { ServiceDatabase } from '../../../services/database/database.service';
import { CmdPublish } from './publish.cmd';
import { expect } from 'chai';
import { ExampleProjectUnity } from '../../../shared/tests/example-project/unity/example-project-unity';
import * as tmp from 'tmp';
import { SynchrounousResult } from 'tmp';
import * as fs from 'fs';
import rimraf = require('rimraf');
import { serviceTmp } from '../../../services/tmp/tmp.service';
import { unityExampleProjectFiles } from '../../../shared/tests/example-project/unity/unity-example-project-files';
import { ModelUvpmConfig } from '../../../models/uvpm/uvpm-config.model';
import * as glob from 'glob';
import * as sinon from 'sinon';
import { SinonStub } from 'sinon';
import { ServicePackageVersions } from '../../../services/package-versions/package-versions.service';
import { ServicePackages } from '../../../services/packages/packages.service';
import { IPackage } from '../../../shared/interfaces/packages/i-package';
import { IPackageVersion } from '../../../shared/interfaces/packages/versions/i-package-version';
import { A } from '../../../shared/tests/builder/a';
import * as mkdirp from 'mkdirp';
import { ServiceAxios } from '../../../services/axios/axios.service';

async function getFiles (destination: string) {
  return await new Promise<string[]>((resolve, reject) => {
    glob(`${destination}/**/*`, { dot: true }, (err, res) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(res);
    });
  });
}

describe('CmdPublish', () => {
  let db: ServiceDatabase;
  let profile: ModelProfile;
  let config: ModelUvpmConfig;
  let servicePackages: ServicePackages;
  let servicePackageVersions: ServicePackageVersions;
  let cmd: CmdPublish;

  let unityProject: ExampleProjectUnity;
  let tmpProjectFolder: SynchrounousResult;
  let source: string;
  let destination: string;

  let stubIsFile: SinonStub;

  beforeEach(async () => {
    tmpProjectFolder = tmp.dirSync();
    unityProject = new ExampleProjectUnity();
    unityProject.root = tmpProjectFolder.name;
    await unityProject.createProject();
    source = unityProject.root;
    destination = `${serviceTmp.tmpFolder}/${unityProject.config.name}`;

    db = new ServiceDatabase();
    profile = new ModelProfile(db);
    profile.server = 'http://uvpm.com';
    profile.email = 'asdf@asdf.com';
    profile.token = '34l2j3jkl@34jkkj3';

    config = unityProject.config;
    config.name = 'my-project';

    const serviceAxis = new ServiceAxios(profile);
    servicePackages = new ServicePackages(profile, serviceAxis);
    servicePackageVersions = new ServicePackageVersions(profile, serviceAxis);

    stubIsFile = sinon.stub(config, 'isFile')
      .get(() => true);

    cmd = A.command()
      .withServiceDatabase(db)
      .withModelProfile(profile)
      .withModelUvpmConfig(config)
      .withServicePackages(servicePackages)
      .withServicePackageVersions(servicePackageVersions)
      .build(CmdPublish);
  });

  afterEach(() => {
    stubIsFile.restore();
    rimraf.sync(tmpProjectFolder.name);
  });

  it('should initialize', () => {
    expect(cmd).to.be.ok;
  });

  describe('action', () => {
    let unityPackageData: IPackage;

    let stubPackageCreate: SinonStub;
    let stubPackageGet: SinonStub;
    let stubPackageVersionsAdd: SinonStub;
    let stubProjectFolderPath: SinonStub;
    let stubClearTmp: SinonStub;

    beforeEach(() => {
      unityPackageData = {
        name: config.name,
        versions: [
          {
            name: config.version.toString(),
            archive: 'ARCHIVE GOES HERE',
          },
        ],
      };
    });

    beforeEach(() => {
      stubPackageCreate = sinon.stub(servicePackages, 'create');
      stubPackageCreate.callsFake(() => new Promise((resolve) => resolve()));

      stubPackageGet = sinon.stub(servicePackages, 'get');
      // @ts-ignore
      stubPackageGet.callsFake(() => new Promise((resolve, reject) => reject()));

      stubPackageVersionsAdd = sinon.stub(servicePackageVersions, 'add');
      stubPackageVersionsAdd.callsFake(() => new Promise((resolve) => resolve()));

      stubProjectFolderPath = sinon.stub(CmdPublish.prototype, 'projectFolderPath' as any);
      stubProjectFolderPath.get(() => tmpProjectFolder.name);

      stubClearTmp = sinon.stub(CmdPublish.prototype, 'clearTmp' as any);
    });

    afterEach(() => {
      stubPackageCreate.restore();
      stubPackageGet.restore();
      stubPackageVersionsAdd.restore();
      stubProjectFolderPath.restore();
      stubClearTmp.restore();
    });

    it('should run', async () => {
      await cmd.action();
    });

    it('should print a message on success', async () => {
      const successMessage = `Package ${config.name} v${config.version} published to ${profile.server}`;

      await cmd.action();

      expect(cmd.logError.lastEntry).to.not.be.ok;
      expect(cmd.log.lastEntry).to.eq(successMessage);
    });

    it('should dump the correct files in the root when unpacked', async () => {
      const expectedFiles = ['Assets', 'uvpm.json'];
      const archiveDump = tmp.dirSync();

      await cmd.action();

      const archive = `${serviceTmp.tmpFolder}/${CmdPublish.ARCHIVE_NAME}`;
      await CmdPublish.extractArchive(archive, archiveDump.name);

      const unpackedRoot = fs.readdirSync(archiveDump.name);
      rimraf.sync(archiveDump.name);

      expect(unpackedRoot).to.deep.eq(expectedFiles);
    });

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

    it('should print a message when starting', async () => {
      await cmd.action();

      expect(cmd.log.history[0]).to.eq('Packaging file for publishing...');
    });

    it('should call get the package by name', async () => {
      await cmd.action();

      expect(stubPackageGet.calledWith(config.name)).to.be.ok;
    });

    describe('packages create service', () => {
      it('should be called if the package is new', async () => {
        await cmd.action();

        expect(stubPackageCreate.called).to.be.ok;
      });

      it('should receive the package data with the archive', async () => {
        await cmd.action();

        unityPackageData.versions[0].archive =
          fs.readFileSync(`${serviceTmp.tmpFolder}/${CmdPublish.ARCHIVE_NAME}`).toString('base64');

        const callArgs = stubPackageCreate.args[0][0] as any;
        expect(callArgs.name).to.eq(config.name);
        expect(callArgs.versions[0].name).to.eq(config.version.toString());
        expect(callArgs.versions[0].archive).to.eq(unityPackageData.versions[0].archive);
      });

      it('should log an error if the service fails', async () => {
        const errMsg = 'Failed to get the requested package';

        stubPackageCreate.callsFake(() => {
          // @ts-ignore
          return new Promise((resolve, reject) => reject(errMsg));
        });

        await cmd.action();

        expect(cmd.logError.lastEntry).to.eq(errMsg);
      });
    });

    describe('package versions create service', () => {
      beforeEach(() => {
        stubPackageGet.callsFake(() => new Promise((resolve) => resolve({})));
      });

      it('should be called if this package already exists', async () => {
        await cmd.action();

        expect(stubPackageVersionsAdd.called).to.be.ok;
      });

      it('should receive the package data with the archive', async () => {
        await cmd.action();

        unityPackageData.versions[0].archive =
          fs.readFileSync(`${serviceTmp.tmpFolder}/${CmdPublish.ARCHIVE_NAME}`).toString('base64');

        const packageName: string = stubPackageVersionsAdd.args[0][0] as any;
        const version: IPackageVersion = stubPackageVersionsAdd.args[0][1] as any;

        expect(packageName).to.eq(unityPackageData.name);
        expect(version.name).to.eq(config.version.toString());
        expect(version.archive).to.eq(unityPackageData.versions[0].archive);
      });

      it('should log an error if the service fails', async () => {
        const errMsg = 'Failed to add the requested package service';

        stubPackageVersionsAdd.callsFake(() => {
          // @ts-ignore
          return new Promise((resolve, reject) => reject(errMsg));
        });

        await cmd.action();

        expect(cmd.logError.lastEntry).to.eq(errMsg);
      });
    });

    it('should delete the leftover files after the action completes', async () => {
      stubClearTmp.callThrough();

      await cmd.action();

      expect(fs.existsSync(serviceTmp.tmpFolder)).to.not.be.ok;
    });

    it('should fail if the target folder is missing', async () => {
      const nonExistentFolder = 'i-do-not-exist';
      const errMsg = `The publish folder ${nonExistentFolder} does not exist`;

      config.publishing.targetFolder = 'i-do-not-exist';

      await cmd.action();

      expect(cmd.logError.lastEntry).to.eq(errMsg);
    });

    it('should fail if the config.version is missing', async () => {
      const errMsg = `Please provide a version in your uvpm.json file`;
      config.version = undefined as any;

      await cmd.action();

      expect(cmd.logError.lastEntry).to.eq(errMsg);
    });

    it('should fail if the config.publishing object is missing', async () => {
      const errMsg = `Please provide a valid config.publishing object`;
      config.publishing = undefined as any;

      await cmd.action();

      expect(cmd.logError.lastEntry).to.eq(errMsg);
    });
  });

  describe('copyProject', () => {
    it('should copy files and folders from the source to the target folder', async () => {
      await cmd.copyProject(source, destination);

      unityExampleProjectFiles.forEach((f) => {
        let path = destination;
        if (f.path) {
          path += `/${f.path}`;
        }

        path += `/${f.file}`;

        const itemExists = fs.existsSync(path);

        expect(itemExists).to.be.ok;
      });
    });

    it('should place a copy of the uvpm.json file in the destination root', async () => {
      await cmd.copyProject(source, destination);

      expect(fs.existsSync(`${destination}/uvpm.json`)).to.be.ok;
    });

    it('should fail if the directory to copy does not exist', async () => {
      let err: string = undefined as any;
      try {
        await cmd.copyProject('i-do-not-exist', destination);
      } catch (message) {
        err = message;
      }

      expect(err).to.be.ok;
    });
  });

  describe('cleanFolder', () => {
    it('should delete all files except the publishing.targetFolder and uvpm.json', async () => {
      const sourceTarget = `${source}/${unityProject.config.publishing.targetFolder}`;
      const destinationTarget = `${destination}/${unityProject.config.publishing.targetFolder}`;

      mkdirp.sync(destinationTarget);
      await cmd.copyProject(sourceTarget, destinationTarget);
      await cmd.copyProject(`${source}/uvpm.json`, `${destination}/uvpm.json`);
      await cmd.cleanFolder(destination);

      const files = fs.readdirSync(destination);
      const configFile = files.find((f) => f.includes('uvpm.json'));
      const targetFolder = files.find((f) => f.includes(unityProject.config.publishing.targetFolder));
      const targetFolderFiles = fs.readdirSync(`${destination}/${targetFolder}`);

      expect(configFile).to.be.ok;
      expect(targetFolder).to.be.ok;
      expect(files.length).to.eq(2);
      expect(targetFolderFiles.length > 1).to.be.ok;
    });

    it('should delete all ignored files with .meta from the project', async () => {
      await cmd.copyProject(source, destination);
      await cmd.cleanFolder(destination);

      const files = fs.readdirSync(`${destination}/Assets/MyProject`);

      files.forEach((f) => {
        expect(f).to.not.contain('Ignore');
      });
    });

    it('should fail if the source does not exist', async () => {
      let err: string = undefined as any;
      try {
        await cmd.cleanFolder('i-do-not-exist');
      } catch (message) {
        err = message;
      }

      expect(err).to.eq(`Folder i-do-not-exist does not exist`);
    });
  });

  describe('createArchive', () => {
    it('should turn the passed folder into an archive at the destination', async () => {
      const archiveSource = `${destination}`;
      const archiveDestination = `${serviceTmp.tmpFolder}/${CmdPublish.ARCHIVE_NAME}`;

      await cmd.copyProject(source, destination);
      await cmd.cleanFolder(destination);
      await CmdPublish.createArchive(archiveSource, archiveDestination);

      expect(fs.existsSync(archiveDestination)).to.be.ok;
    });

    it('should have the same files and folders when unarchived', async () => {
      const archiveSource = `${destination}`;
      const archiveDestination = `${serviceTmp.tmpFolder}/${CmdPublish.ARCHIVE_NAME}`;
      const unarchiveDestination = `${serviceTmp.tmpFolder}/archive`;

      await cmd.copyProject(source, destination);
      await cmd.cleanFolder(destination);
      const copiedFiles = await getFiles(destination);
      expect(copiedFiles).to.be.ok;
      expect(copiedFiles.length).to.be.greaterThan(1);

      await CmdPublish.createArchive(archiveSource, archiveDestination);

      // Unzip the archive
      fs.mkdirSync(unarchiveDestination);
      await CmdPublish.extractArchive(archiveDestination, unarchiveDestination);
      const extractedFiles = await getFiles(unarchiveDestination);
      expect(extractedFiles).to.be.ok;

      copiedFiles.forEach((f) => {
        const path = f.replace(archiveSource, '');
        const match = extractedFiles.find((fAlt) => {
          const cleanPath = fAlt.replace(unarchiveDestination, '');
          return path === cleanPath;
        });

        expect(match).to.be.ok;
      });
    });

    it('should have the same files and folders when convert to string, then file, then turned back', async () => {
      const archiveSource = `${destination}`;
      const archiveDestination = `${serviceTmp.tmpFolder}/${CmdPublish.ARCHIVE_NAME}`;
      const unarchiveDestination = `${serviceTmp.tmpFolder}/archive`;

      await cmd.copyProject(source, destination);
      await cmd.cleanFolder(destination);
      const copiedFiles = await getFiles(destination);
      expect(copiedFiles).to.be.ok;
      expect(copiedFiles.length).to.be.greaterThan(1);

      await CmdPublish.createArchive(archiveSource, archiveDestination);

      const archiveString = fs.readFileSync(archiveDestination);
      const tmpArchive = tmp.fileSync().name;
      fs.writeFileSync(tmpArchive, archiveString);

      fs.mkdirSync(unarchiveDestination);
      await CmdPublish.extractArchive(tmpArchive, unarchiveDestination);
      const extractedFiles = await getFiles(unarchiveDestination);

      copiedFiles.forEach((f) => {
        const path = f.replace(archiveSource, '');
        const match = extractedFiles.find((fAlt) => {
          const cleanPath = fAlt.replace(unarchiveDestination, '');
          return path === cleanPath;
        });

        expect(match).to.be.ok;
      });
    });
  });
});
