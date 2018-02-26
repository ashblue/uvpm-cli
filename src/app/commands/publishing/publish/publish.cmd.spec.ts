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

describe('CmdPublish', () => {
  let db: ServiceDatabase;
  let profile: ModelProfile;
  let config: ModelUvpmConfig;
  let cmd: CmdPublish;

  let unityProject: ExampleProjectUnity;
  let tmpProjectFolder: SynchrounousResult;
  let source: string;
  let destination: string;

  beforeEach(async () => {
    db = new ServiceDatabase();
    profile = new ModelProfile(db);
    config = new ModelUvpmConfig();

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
    rimraf.sync(tmpProjectFolder.name);
  });

  it('should initialize', () => {
    expect(cmd).to.be.ok;
  });

  describe('action', () => {
    xit('should publish an archive file to the server');

    xit('should fail if the user is not logged in');

    xit('should fail if a server has not been set');

    xit('should fail if a uvpm.json file is not present');

    xit('should log an error if the server does not respond');

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
    xit('should turn the passed folder into an archive at the destination');

    xit('should have the same files and folders when unarchived');
  });
});
