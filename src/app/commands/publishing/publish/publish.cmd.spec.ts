import { ModelProfile } from '../../../models/profile/profile.model';
import { ServiceDatabase } from '../../../services/database/database.service';
import * as inquirer from 'inquirer';
import { Command } from 'commander';
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
import * as tar from 'tar';
import * as sinon from 'sinon';
import { SinonStub } from 'sinon';

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
  let cmd: CmdPublish;

  let unityProject: ExampleProjectUnity;
  let tmpProjectFolder: SynchrounousResult;
  let source: string;
  let destination: string;

  let stubIsFile: SinonStub;

  beforeEach(async () => {
    db = new ServiceDatabase();
    profile = new ModelProfile(db);
    profile.server = 'http://uvpm.com';
    profile.email = 'asdf@asdf.com';
    profile.token = '34l2j3jkl@34jkkj3';

    config = new ModelUvpmConfig();
    config.name = 'my-project';

    stubIsFile = sinon.stub(config, 'isFile')
      .get(() => true);

    cmd = new CmdPublish(db, profile, config, new Command(), inquirer);
  });

  beforeEach(async () => {
    tmpProjectFolder = tmp.dirSync();
    unityProject = new ExampleProjectUnity();
    await unityProject.createProject(tmpProjectFolder.name);

    source = unityProject.root;
    destination = `${serviceTmp.tmpFolder}/${unityProject.config.name}`;
  });

  afterEach(() => {
    stubIsFile.restore();
    rimraf.sync(tmpProjectFolder.name);
  });

  it('should initialize', () => {
    expect(cmd).to.be.ok;
  });

  describe('action', () => {
    it('should run', async () => {
      await cmd.action();
    });

    it('should print a message on success', async () => {
      const successMessage = `Package ${config.name} v${config.version} published to ${profile.server}`;

      await cmd.action();

      expect(cmd.lastLogErr).to.not.be.ok;
      expect(cmd.lastLog).to.eq(successMessage);
    });

    it('should fail if a uvpm.json file is not present', async () => {
      const errMsg = 'Please create a uvpm.json file';

      stubIsFile.get(() => false);
      await cmd.action();

      expect(cmd.lastLogErr).to.contain(errMsg);
    });

    it('should fail if a server has not been set', async () => {
      const errMsg = 'Please set a server before using this action';

      profile.server = null;
      await cmd.action();

      expect(cmd.lastLogErr).to.contain(errMsg);
    });

    it('should fail if the user is not logged in', async () => {
      const errMsg = 'Please login before using this action';

      profile.email = undefined as any;
      profile.token = undefined as any;
      await cmd.action();

      expect(cmd.lastLogErr).to.contain(errMsg);
    });

    xit('should publish an archive file to the server for a new package', () => {
      // Expect the package service to run with appropriate data and return a success message
      // No error logs detected
    });

    xit('should log an error if the package service fails');

    xit('should use the uvpm.json package name and version to publish');

    xit('should use a package create command if first time publishing');

    xit('should use a version add command if the package already exists');

    xit('should display to the user the progress of the file upload');

    xit('should delete the leftover files after the action completes');

    xit('should fail if the target folder is missing');

    xit('should fail if the version is missing');
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

    xit('should not copy the git directory over');
  });

  describe('cleanFolder', () => {
    it('should delete all files except the publishing.targetFolder and uvpm.json', async () => {
      await cmd.copyProject(source, destination);
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
  });

  describe('createArchive', () => {
    it('should turn the passed folder into an archive at the destination', async () => {
      const archiveSource = `${destination}`;
      const archiveDestination = `${serviceTmp.tmpFolder}/archive.tar.gz`;

      await cmd.copyProject(source, destination);
      await cmd.cleanFolder(destination);
      await cmd.createArchive(archiveSource, archiveDestination);

      expect(fs.existsSync(archiveDestination)).to.be.ok;
    });

    it('should have the same files and folders when unarchived', async () => {
      const archiveSource = `${destination}`;
      const archiveDestination = `${serviceTmp.tmpFolder}/archive.tar.gz`;
      const unarchiveDestination = `${serviceTmp.tmpFolder}/archive`;

      await cmd.copyProject(source, destination);
      await cmd.cleanFolder(destination);
      const copiedFiles = await getFiles(destination);
      expect(copiedFiles).to.be.ok;
      expect(copiedFiles.length).to.be.greaterThan(1);

      await cmd.createArchive(archiveSource, archiveDestination);

      // Unzip the archive
      fs.mkdirSync(unarchiveDestination);
      await tar.extract({
        file: archiveDestination,
        cwd: unarchiveDestination,
      });
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
  });
});
