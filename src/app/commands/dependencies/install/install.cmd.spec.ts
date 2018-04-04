import { ServicePackageVersions } from '../../../services/package-versions/package-versions.service';
import { ModelProfile } from '../../../models/profile/profile.model';
import { ServicePackages } from '../../../services/packages/packages.service';
import { ServiceDatabase } from '../../../services/database/database.service';
import { ModelUvpmConfig } from '../../../models/uvpm/uvpm-config.model';
import { CmdInstall } from './install.cmd';
import { Command } from 'commander';
import * as sinon from 'sinon';
import { SinonStub } from 'sinon';
import { expect } from 'chai';
import rimraf = require('rimraf');
import * as fs from 'fs';
import { IPackage } from '../../../shared/interfaces/packages/i-package';
import * as glob from 'glob';
import * as tar from 'tar';
import { A } from '../../../shared/tests/builder/a';
import { ExampleProjectUnity } from '../../../shared/tests/example-project/unity/example-project-unity';
import { IPackageVersion } from '../../../shared/interfaces/packages/versions/i-package-version';
import { IUvpmPackage } from '../../../shared/interfaces/uvpm/config/i-uvpm-config-package';
import * as tmp from 'tmp';
import { ServiceCache } from '../../../services/cache/cache.service';

// @TODO Break this file into two files. One for each install command variation
describe('CmdInstall', () => {
  let db: ServiceDatabase;
  let profile: ModelProfile;
  let config: ModelUvpmConfig;
  let servicePackages: ServicePackages;
  let servicePackageVersions: ServicePackageVersions;
  let cmd: CmdInstall;
  let program: Command;
  let unityProject: ExampleProjectUnity;
  let serviceCache: ServiceCache;

  let stubIsFile: SinonStub;
  let stubFileRoot: SinonStub;
  let stubConfigSave: SinonStub;

  beforeEach(async () => {
    db = new ServiceDatabase();
    profile = new ModelProfile(db);
    profile.server = 'http://uvpm.com';
    profile.email = 'asdf@asdf.com';
    profile.token = '34l2j3jkl@34jkkj3';

    config = new ModelUvpmConfig();
    config.name = 'my-project';
    stubConfigSave = sinon.stub(config, 'save');

    servicePackages = new ServicePackages(profile);
    servicePackageVersions = new ServicePackageVersions(profile);
    serviceCache = new ServiceCache(db);

    program = new Command();

    stubIsFile = sinon.stub(config, 'isFile')
      .get(() => true);

    unityProject = await A.unityPackage()
      .build();

    stubFileRoot = sinon.stub(CmdInstall.prototype, 'fileRoot' as any)
      .get(() => unityProject.root);

    cmd = A.command()
      .withServiceDatabase(db)
      .withModelProfile(profile)
      .withModelUvpmConfig(config)
      .withCommanderProgram(program)
      .withServicePackages(servicePackages)
      .withServicePackageVersions(servicePackageVersions)
      .withServiceCache(serviceCache)
      .build(CmdInstall);
  });

  afterEach(async () => {
    stubFileRoot.restore();
    stubIsFile.restore();

    await unityProject.deleteProject();
  });

  it('should initialize', () => {
    expect(cmd).to.be.ok;
  });

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

  describe('commands', () => {
    let stubServicePackagesGet: SinonStub;
    let stubDownloadArchive: SinonStub;
    let outputLocation: string;

    function setPackageServiceGetResponse (packages: ExampleProjectUnity[]) {
      stubServicePackagesGet.callsFake((name): Promise<IPackage> => {
        return new Promise<IPackage>((resolve, reject) => {
          const packageMatches = packages.filter((pack) => pack.config.name === name);

          if (packageMatches.length === 0) {
            reject();
            return;
          }

          resolve({
            name: packageMatches[0].config.name,
            versions: packageMatches.map<IPackageVersion>((pack) => {
              return {
                name: pack.config.version.toString(),
                archive: pack.archive,
              };
            }),
          });
        });
      });

      stubDownloadArchive.callsFake((name, version) => {
        return new Promise<string>((resolve, reject) => {
          const packageMatches = packages.filter((pack) => {
            return pack.config.name === name && pack.config.version.toString() === version;
          });

          if (packageMatches.length === 0) {
            reject();
            return;
          }

          resolve(packageMatches[0].archive);
        });
      });
    }

    beforeEach(() => {
      outputLocation = `${unityProject.root}/${config.dependencies.outputFolder}`;
      stubServicePackagesGet = sinon.stub(servicePackages, 'get');
      stubDownloadArchive = sinon.stub(servicePackageVersions, 'downloadArchive');
    });

    describe('uvpm install PACKAGE', () => {
      const packageData: IPackage = {
        name: 'my-package',
        versions: [
          {
            name: '1.2.0',
            archive: '',
          },
          {
            name: '1.0.7',
            archive: '',
          },
          {
            name: '0.1.0',
            archive: '',
          },
        ],
      };

      beforeEach(() => {
        stubServicePackagesGet.returns(packageData);
        stubDownloadArchive.callsFake(() => {
            return new Promise<string>((resolve) => {
              resolve(tmp.fileSync().name);
            });
          });
      });

      describe('servicePackages', () => {
        it('should get the package by name from servicePackages.get', async () => {
          await cmd.action(packageData.name);

          expect(stubServicePackagesGet.calledWith(packageData.name)).to.be.ok;
        });

        it('should return package data from servicePackages.get', async () => {
          await cmd.action(packageData.name);

          expect(stubServicePackagesGet.returned(packageData)).to.be.ok;
        });

        it('should fail if servicePackages.get fails', async () => {
          const errMsg = 'Failed to find package';

          // @ts-ignore
          stubServicePackagesGet.returns(new Promise((resolve, reject) => reject(errMsg)));

          await cmd.action(packageData.name);

          expect(cmd.logError.lastEntry).to.eq(errMsg);
        });
      });

      describe('file handling', () => {
        it('should auto generate the destination folder if it does not already exist', async () => {
          await cmd.action(packageData.name);

          expect(fs.existsSync(outputLocation)).to.be.ok;
        });

        it('should create a folder with the package\'s name in the output folder', async () => {
          await cmd.action(packageData.name);

          let outputFiles: string[];
          try {
            outputFiles = fs.readdirSync(outputLocation);
          } finally {
            rimraf.sync(unityProject.root);
          }

          expect(outputFiles).to.contain(packageData.name);
        });

        it('should have the same number of files as the archive in the output folder', async () => {
          program.examples = true;
          program.tests = true;

          const archivePackage = await A.unityPackage()
            .withName(packageData.name)
            .build();

          const archiveFiles = await new Promise<string[]>((resolve, reject) => {
            const filePathGlob = `${archivePackage.root}/**/!(*.tar.gz)`;
            glob(filePathGlob, { dot: true }, (err, result) => {
              if (err) {
                reject(err);
                return;
              }

              resolve(result);
            });
          });

          setPackageServiceGetResponse([archivePackage]);

          await cmd.action(packageData.name);

          const installedFiles = await new Promise<string[]>((resolve, reject) => {
            const getFileGlob = `${outputLocation}/${archivePackage.config.name}/**/!(*.tar.gz)`;
            glob(getFileGlob, { dot: true }, (err, result) => {
              if (err) {
                reject(err);
                return;
              }

              resolve(result);
            });
          });

          await archivePackage.deleteProject();

          expect(archiveFiles.length).to.eq(installedFiles.length);
        });

        it('should unpack the archive files into the named output folder', async () => {
          program.examples = true;
          program.tests = true;

          const archivePackage = await A.unityPackage()
            .withName(packageData.name)
            .build();
          const archiveFiles = await new Promise<string[]>((resolve, reject) => {
            const filePathGlob = `${archivePackage.root}/**/!(*.tar.gz)`;
            glob(filePathGlob, { dot: true }, (err, result) => {
              if (err) {
                reject(err);
                return;
              }

              resolve(result);
            });
          });

          setPackageServiceGetResponse([archivePackage]);

          const relativePackageFiles = archiveFiles.map((path) => {
            return path.replace(archivePackage.root, '');
          });

          await cmd.action(packageData.name);

          const installedFiles = await new Promise<string[]>((resolve, reject) => {
            const getFileGlob = `${outputLocation}/${archivePackage.config.name}/**/!(*.tar.gz)`;
            glob(getFileGlob, { dot: true }, (err, result) => {
              if (err) {
                reject(err);
                return;
              }

              resolve(result);
            });
          });

          await archivePackage.deleteProject();

          relativePackageFiles.forEach((packageFile) => {
            const result = installedFiles.find((file) => {
              const fileRelative = file.replace(`${outputLocation}/${archivePackage.config.name}`, '');
              return fileRelative === packageFile;
            });

            expect(result).to.be.ok;
          });
        });

        it('should install the latest version of the package', async () => {
          const stubTarExtract = sinon.stub(tar, 'extract');
          stubTarExtract.returns(new Promise((resolve) => resolve()));

          const archivePackage = await A.unityPackage()
            .withName(packageData.name)
            .withVersion('1.0.0')
            .build();

          const archivePackageNewer = await A.unityPackage()
            .withName(packageData.name)
            .withVersion('1.2.0')
            .build();

          setPackageServiceGetResponse([archivePackage, archivePackageNewer]);

          await cmd.action(packageData.name);

          stubTarExtract.restore();

          expect(stubTarExtract.args[0][0].file).to.eq(archivePackageNewer.archive);
        });

        describe('http archive downloads', () => {
          it('should download the archive file via ServicePackage.downloadArchive', async () => {
            const unityPackage = await A.unityPackage()
              .withName(packageData.name)
              .withVersion('1.2.0')
              .build();

            setPackageServiceGetResponse([unityPackage]);

            await cmd.action(packageData.name);

            expect(stubDownloadArchive.calledWith(unityPackage.config.name, unityPackage.config.version.toString()))
              .to.be.ok;
          });

          it('should fire an error if ServicePackage.downloadArchive fails', async () => {
            const errMsg = 'Could not find the download';

            stubDownloadArchive
              .callsFake(() => {
                // @ts-ignore
                return new Promise<string>((resolve, reject) => {
                  reject(errMsg);
                });
              });

            await cmd.action(packageData.name);

            expect(cmd.logError.lastEntry).to.eq(errMsg);
          });
        });

        describe('dependencies', () => {
          it('should install all dependencies listed in the config', async () => {
            const depA = await A.unityPackage()
              .withName('dep-a')
              .build();

            const depB = await A.unityPackage()
              .withName('dep-b')
              .build();

            const unityPackage = await A.unityPackage()
              .withDependency(depA.config.name, depA.config.version.toString())
              .withDependency(depB.config.name, depB.config.version.toString())
              .withName(packageData.name)
              .build();

            const dependencyNames = [depA.config.name, depB.config.name, unityPackage.config.name];

            setPackageServiceGetResponse([depA, depB, unityPackage]);

            await cmd.action(packageData.name);
            const installedPackageFolders = fs.readdirSync(outputLocation);

            await depA.deleteProject();
            await depB.deleteProject();
            await unityPackage.deleteProject();

            dependencyNames.forEach((d) => {
              expect(installedPackageFolders).to.contain(d);
            });
          });

          it('should install the specific dependency version listed in the config', async () => {
            const depName = 'dep-a';

            const depOld = await A.unityPackage()
              .withName(depName)
              .withVersion('1.0.0')
              .build();

            const depNew = await A.unityPackage()
              .withName(depName)
              .withVersion('1.1.0')
              .build();

            const unityPackage = await A.unityPackage()
              .withDependency(depOld.config.name, depOld.config.version.toString())
              .withName(packageData.name)
              .build();

            setPackageServiceGetResponse([depOld, depNew, unityPackage]);

            await cmd.action(packageData.name);

            await depOld.deleteProject();
            await depNew.deleteProject();
            await unityPackage.deleteProject();

            const depConfigString = fs.readFileSync(`${outputLocation}/${depName}/uvpm.json`).toString();
            const depConfig = new ModelUvpmConfig(JSON.parse(depConfigString));

            expect(depConfig.version.toString()).to.eq(depOld.config.version.toString());
          });

          it('should install dependencies of nested children several levels deep', async () => {
            const depA = await A.unityPackage()
              .withName('dep-a')
              .build();

            const depB = await A.unityPackage()
              .withName('dep-b')
              .withDependency(depA.config.name)
              .build();

            const depC = await A.unityPackage()
              .withName('dep-c')
              .withDependency(depB.config.name)
              .build();

            const depD = await A.unityPackage()
              .withName('dep-d')
              .withDependency(depC.config.name)
              .build();

            const depE = await A.unityPackage()
              .withName('dep-e')
              .withDependency(depD.config.name)
              .build();

            const unityPackage = await A.unityPackage()
              .withDependency(depE.config.name, depE.config.version.toString())
              .withName(packageData.name)
              .build();

            const folders = [
              depA.config.name,
              depB.config.name,
              depC.config.name,
              depD.config.name,
              depE.config.name,
              unityPackage.config.name,
            ];

            setPackageServiceGetResponse([depA, depB, depC, depD, depE, unityPackage]);

            await cmd.action(packageData.name);
            const installedPackageFolders = fs.readdirSync(outputLocation);

            await depA.deleteProject();
            await depB.deleteProject();
            await depC.deleteProject();
            await depD.deleteProject();
            await depE.deleteProject();
            await unityPackage.deleteProject();

            folders.forEach((d) => {
              expect(installedPackageFolders).to.contain(d);
            });
          });

          it('should overwrite an older version if re-installing', async () => {
            const unityPackage = await A.unityPackage()
              .withName(packageData.name)
              .build();

            const unityPackageAlt = await A.unityPackage()
              .withName(packageData.name)
              .withVersion('1.3.4')
              .build();

            setPackageServiceGetResponse([unityPackage]);
            await cmd.action(packageData.name);

            setPackageServiceGetResponse([unityPackage, unityPackageAlt]);
            await cmd.action(packageData.name);

            await unityPackage.deleteProject();
            await unityPackageAlt.deleteProject();

            const configPath = `${outputLocation}/${packageData.name}/uvpm.json`;
            const configText = fs.readFileSync(configPath).toString();
            const unityPackageConfig = new ModelUvpmConfig(JSON.parse(configText));

            expect(unityPackageConfig.version.toString()).to.eq(unityPackageAlt.config.version.toString());
          });

          describe('http archive downloads', () => {
            it('should download the archive file via ServicePackage.downloadArchive', async () => {
              const depA = await A.unityPackage()
                .withName('dep-a')
                .build();

              const unityPackage = await A.unityPackage()
                .withName(packageData.name)
                .withDependency(depA.config.name, depA.config.version.toString())
                .build();

              setPackageServiceGetResponse([unityPackage, depA]);

              await cmd.action(packageData.name);

              expect(stubDownloadArchive.calledWith(depA.config.name, depA.config.version.toString()))
                .to.be.ok;
            });
          });

          describe('failures', () => {
            it('should not infinitely loop if two packages reference each other', async () => {
              const depA = await A.unityPackage()
                .withName('dep-a')
                .withDependency('dep-b')
                .build();

              const depB = await A.unityPackage()
                .withName('dep-b')
                .withDependency(depA.config.name)
                .build();

              const unityPackage = await A.unityPackage()
                .withDependency(depA.config.name, depA.config.version.toString())
                .withName(packageData.name)
                .build();

              const stubInstallPackage = sinon.stub(CmdInstall.prototype, 'installPackage' as any)
                .callThrough();

              setPackageServiceGetResponse([depA, depB, unityPackage]);

              await cmd.action(packageData.name);

              stubInstallPackage.restore();

              await depA.deleteProject();
              await depB.deleteProject();
              await unityPackage.deleteProject();

              expect(stubInstallPackage.getCalls().length).to.eq(4);
            });

            describe('not found', () => {
              it('should fire a warning if a specific version cannot be found', async () => {
                const depName = 'dep-a';
                const fakeVersion = '3.0.0';
                const errMsg = `Version ${fakeVersion} not found for package ${depName}.`
                  + ` Installed version 1.0.0 instead`;

                const dep = await A.unityPackage()
                  .withName('dep-a')
                  .withVersion('1.0.0')
                  .build();

                const unityPackage = await A.unityPackage()
                  .withDependency(dep.config.name, fakeVersion)
                  .withName(packageData.name)
                  .build();

                setPackageServiceGetResponse([dep, unityPackage]);

                await cmd.action(packageData.name);

                await dep.deleteProject();
                await unityPackage.deleteProject();

                expect(cmd.logWarning.lastEntry).to.eq(errMsg);
              });

              it('should install the latest if a specific version cannot be found', async () => {
                const depName = 'dep-a';
                const fakeVersion = '1.0.0';
                const oldVersion = '2.1.0';
                const newVersion = '2.2.0';

                const depA = await A.unityPackage()
                  .withName(depName)
                  .withVersion(oldVersion)
                  .build();

                const depB = await A.unityPackage()
                  .withName(depName)
                  .withVersion(newVersion)
                  .build();

                const unityPackage = await A.unityPackage()
                  .withDependency(depA.config.name, fakeVersion)
                  .withName(packageData.name)
                  .build();

                setPackageServiceGetResponse([depA, depB, unityPackage]);

                await cmd.action(packageData.name);

                // Read the file's config
                const depConfigString = fs.readFileSync(`${outputLocation}/${depName}/uvpm.json`).toString();
                const depConfig = new ModelUvpmConfig(JSON.parse(depConfigString));

                await depA.deleteProject();
                await depB.deleteProject();
                await unityPackage.deleteProject();

                expect(depConfig.version.toString()).to.eq(newVersion);
              });

              it('should fire an error if a requested package does not exist', async () => {
                const depName = 'dep-a';
                const errMsg = `Package ${depName} does not exist, skipping install`;

                const unityPackage = await A.unityPackage()
                  .withDependency(depName)
                  .withName(packageData.name)
                  .build();

                setPackageServiceGetResponse([unityPackage]);

                await cmd.action(packageData.name);

                await unityPackage.deleteProject();

                expect(cmd.logError.lastEntry).to.eq(errMsg);
              });
            });

            describe('duplicate dependency resolution', () => {
              const targetPackage = 'dep-duplicate';
              const oldVersion = '1.0.0';
              const newVersion = '2.0.0';

              let depA: ExampleProjectUnity;
              let depB: ExampleProjectUnity;
              let depDuplicateOld: ExampleProjectUnity;
              let depDuplicateNew: ExampleProjectUnity;

              beforeEach(async () => {
                depA = await A.unityPackage()
                  .withName('dep-a')
                  .withDependency(targetPackage, oldVersion)
                  .build();

                depB = await A.unityPackage()
                  .withName('dep-b')
                  .withDependency(targetPackage, newVersion)
                  .build();

                depDuplicateOld = await A.unityPackage()
                  .withName(targetPackage)
                  .withVersion(oldVersion)
                  .build();

                depDuplicateNew = await A.unityPackage()
                  .withName(targetPackage)
                  .withVersion(newVersion)
                  .build();
              });

              afterEach(async () => {
                await depA.deleteProject();
                await depB.deleteProject();
                await depDuplicateOld.deleteProject();
                await depDuplicateNew.deleteProject();
              });

              it('should fire a warning if found with non matching versions', async () => {
                const errMsg = `Duplicate package ${targetPackage} detected`;

                const unityPackage = await A.unityPackage()
                  .withDependency(depA.config.name, depA.config.version.toString())
                  .withDependency(depB.config.name, depB.config.version.toString())
                  .withName(packageData.name)
                  .build();

                setPackageServiceGetResponse([depA, depB, depDuplicateNew, depDuplicateOld, unityPackage]);

                await cmd.action(packageData.name);

                await unityPackage.deleteProject();

                const messageIndex = cmd.logWarning.history.length - 2;
                expect(cmd.logWarning.history[messageIndex]).to.eq(errMsg);
              });

              it('should not fire an error', async () => {
                const unityPackage = await A.unityPackage()
                  .withDependency(depA.config.name, depA.config.version.toString())
                  .withDependency(depB.config.name, depB.config.version.toString())
                  .withName(packageData.name)
                  .build();

                setPackageServiceGetResponse([depA, depB, depDuplicateNew, depDuplicateOld, unityPackage]);

                await cmd.action(packageData.name);

                await unityPackage.deleteProject();

                expect(cmd.logError.history.length).to.eq(0);
              });

              it('should fire a warning if overridden with a newer version', async () => {
                const errMsg = `Installing ${targetPackage} version ${newVersion} and deleting ${oldVersion}`;

                const unityPackage = await A.unityPackage()
                  .withDependency(depA.config.name, depA.config.version.toString())
                  .withDependency(depB.config.name, depB.config.version.toString())
                  .withName(packageData.name)
                  .build();

                setPackageServiceGetResponse([depA, depB, depDuplicateNew, depDuplicateOld, unityPackage]);

                await cmd.action(packageData.name);

                await unityPackage.deleteProject();

                expect(cmd.logWarning.lastEntry).to.contain(errMsg);
              });

              it('should install the latest version of a duplicate dependency', async () => {
                const unityPackage = await A.unityPackage()
                  .withDependency(depA.config.name, depA.config.version.toString())
                  .withDependency(depB.config.name, depB.config.version.toString())
                  .withName(packageData.name)
                  .build();

                setPackageServiceGetResponse([depA, depB, depDuplicateNew, depDuplicateOld, unityPackage]);

                await cmd.action(packageData.name);

                await unityPackage.deleteProject();

                const configPath = `${outputLocation}/${targetPackage}/uvpm.json`;
                const replacedConfigText = fs.readFileSync(configPath).toString();
                const replacedConfig = new ModelUvpmConfig(JSON.parse(replacedConfigText));

                expect(replacedConfig.version.toString()).to.contain(newVersion);
              });
            });
          });
        });
      });

      describe('flags', () => {
        let unityPackage: ExampleProjectUnity;

        beforeEach(async () => {
          program.save = true;

          unityPackage = await A.unityPackage()
            .withName(packageData.name)
            .build();
        });

        afterEach(async () => {
          await unityPackage.deleteProject();
        });

        describe('save', () => {
          describe('success', () => {
            it('should write a dependency to the config.json file with a ^ symbol', async () => {
              const addedPackage: IUvpmPackage = {
                name: unityPackage.config.name,
                version: `^${unityPackage.config.version.toString()}`,
              };

              setPackageServiceGetResponse([unityPackage]);

              await cmd.action(packageData.name);

              expect(config.dependencies.packages).to.deep.include.members([addedPackage]);
            });

            it('should save the newest version to the file', async () => {
              const unityPackageAlt = await A.unityPackage()
                .withName(packageData.name)
                .withVersion('1.3.4')
                .build();

              const addedPackage: IUvpmPackage = {
                name: unityPackageAlt.config.name,
                version: `^${unityPackageAlt.config.version.toString()}`,
              };

              setPackageServiceGetResponse([unityPackage, unityPackageAlt]);

              await cmd.action(packageData.name);

              await unityPackageAlt.deleteProject();

              expect(config.dependencies.packages).to.deep.include.members([addedPackage]);
            });

            it('should overwrite a package in the config if overwritten with a higher version', async () => {
              const unityPackageAlt = await A.unityPackage()
                .withName(packageData.name)
                .withVersion('1.3.4')
                .build();

              const addedPackage: IUvpmPackage = {
                name: unityPackageAlt.config.name,
                version: `^${unityPackageAlt.config.version.toString()}`,
              };

              setPackageServiceGetResponse([unityPackage]);
              await cmd.action(packageData.name);

              setPackageServiceGetResponse([unityPackage, unityPackageAlt]);
              await cmd.action(packageData.name);

              await unityPackageAlt.deleteProject();

              expect(config.dependencies.packages).to.deep.include.members([addedPackage]);
            });

            it('should not create a duplicate entry if installing over a pre-existing package', async () => {
              const unityPackageAlt = await A.unityPackage()
                .withName(packageData.name)
                .withVersion('1.3.4')
                .build();

              setPackageServiceGetResponse([unityPackage]);
              await cmd.action(packageData.name);

              setPackageServiceGetResponse([unityPackage, unityPackageAlt]);
              await cmd.action(packageData.name);

              await unityPackageAlt.deleteProject();

              expect(config.dependencies.packages.length).to.eq(1);
            });

            it('should call the config save method', async () => {
              setPackageServiceGetResponse([unityPackage]);

              await cmd.action(packageData.name);

              expect(stubConfigSave.called).to.eq(true);
            });
          });

          describe('failure', () => {
            it('should not save to the uvpm.json if the save flag is missing', async () => {
              const addedPackage: IUvpmPackage = {
                name: unityPackage.config.name,
                version: unityPackage.config.version.toString(),
              };

              setPackageServiceGetResponse([unityPackage]);

              await cmd.action(packageData.name);

              expect(config.dependencies.packages).to.not.deep.include.members([addedPackage]);
            });

            it('should not save to the uvpm.json if the package install fails', async () => {
              setPackageServiceGetResponse([]);

              try {
                await cmd.action(packageData.name);
              } finally {
                const configPath = `${unityProject.root}/uvpm.json`;
                const configText = fs.readFileSync(configPath).toString();
                const newConfig = new ModelUvpmConfig(JSON.parse(configText));

                expect(newConfig.dependencies.packages.length).to.eq(0);
              }
            });
          });
        });

        describe('examples', () => {
          it('should set examples to true in the config if set', async () => {
            program.examples = true;

            const addedPackage: IUvpmPackage = {
              name: unityPackage.config.name,
              version: `^${unityPackage.config.version.toString()}`,
              examples: true,
            };

            setPackageServiceGetResponse([unityPackage]);

            await cmd.action(packageData.name);

            expect(config.dependencies.packages).to.deep.include.members([addedPackage]);
          });

          it('should set examples to false in the config if not set', async () => {
            program.examples = false;

            const addedPackage: IUvpmPackage = {
              name: unityPackage.config.name,
              version: `^${unityPackage.config.version.toString()}`,
            };

            setPackageServiceGetResponse([unityPackage]);

            await cmd.action(packageData.name);

            expect(config.dependencies.packages).to.deep.include.members([addedPackage]);
          });

          it('should install examples if set to true in the config', async () => {
            program.examples = true;

            setPackageServiceGetResponse([unityPackage]);

            await cmd.action(packageData.name);

            const files = fs.readdirSync(
              `${outputLocation}/${unityPackage.config.name}/${unityPackage.config.publishing.targetFolder}/MyProject`);

            ['Examples', 'Examples.meta'].forEach((f) => {
              expect(files).to.contain(f);
            });
          });

          it('should not install examples if set to false in the config', async () => {
            program.examples = false;

            setPackageServiceGetResponse([unityPackage]);

            await cmd.action(packageData.name);

            const files = fs.readdirSync(
              `${outputLocation}/${unityPackage.config.name}/${unityPackage.config.publishing.targetFolder}/MyProject`);

            ['Examples', 'Examples.meta'].forEach((f) => {
              expect(files).to.not.contain(f);
            });
          });
        });

        describe('tests', () => {
          it('should set tests to true in the config if set', async () => {
            program.tests = true;

            const addedPackage: IUvpmPackage = {
              name: unityPackage.config.name,
              version: `^${unityPackage.config.version.toString()}`,
              tests: true,
            };

            setPackageServiceGetResponse([unityPackage]);

            await cmd.action(packageData.name);

            expect(config.dependencies.packages).to.deep.include.members([addedPackage]);
          });

          it('should set tests to false in the config if not set', async () => {
            program.tests = false;

            const addedPackage: IUvpmPackage = {
              name: unityPackage.config.name,
              version: `^${unityPackage.config.version.toString()}`,
            };

            setPackageServiceGetResponse([unityPackage]);

            await cmd.action(packageData.name);

            expect(config.dependencies.packages).to.deep.include.members([addedPackage]);
          });

          it('should install tests if set to true in the config', async () => {
            program.tests = true;

            setPackageServiceGetResponse([unityPackage]);

            await cmd.action(packageData.name);

            const files = fs.readdirSync(
              `${outputLocation}/${unityPackage.config.name}/${unityPackage.config.publishing.targetFolder}/MyProject`);

            ['Testing', 'Testing.meta'].forEach((f) => {
              expect(files).to.contain(f);
            });
          });

          it('should not install tests if set to false in the config', async () => {
            program.tests = false;

            setPackageServiceGetResponse([unityPackage]);

            await cmd.action(packageData.name);

            const files = fs.readdirSync(
              `${outputLocation}/${unityPackage.config.name}/${unityPackage.config.publishing.targetFolder}/MyProject`);

            ['Testing', 'Testing.meta'].forEach((f) => {
              expect(files).to.not.contain(f);
            });
          });
        });
      });

      describe('cache', () => {
        let stubServiceCacheSet: SinonStub;

        beforeEach(() => {
          stubServiceCacheSet = sinon.stub(serviceCache, 'set')
            .returns(new Promise((resolve) => resolve()));
        });

        describe('success', () => {
          it('should create a new cache if a package is successfully installed', async () => {
            const unityPackage = await A.unityPackage()
              .withName(packageData.name)
              .build();

            setPackageServiceGetResponse([unityPackage]);

            await cmd.action(packageData.name);

            await unityPackage.deleteProject();

            expect(stubServiceCacheSet.calledWith(
              unityPackage.config.name,
              unityPackage.config.version.toString(),
              unityPackage.archive,
            )).to.be.ok;
          });

          it('should create a new cache if a package dependency is successfully installed', async () => {
            const depA = await A.unityPackage()
              .withName('dep-a')
              .build();

            const unityPackage = await A.unityPackage()
              .withName(packageData.name)
              .withDependency(depA.config.name, depA.config.version.toString())
              .build();

            setPackageServiceGetResponse([unityPackage, depA]);

            await cmd.action(packageData.name);

            await unityPackage.deleteProject();
            await depA.deleteProject();

            expect(stubServiceCacheSet.calledWith(
              depA.config.name,
              depA.config.version.toString(),
              depA.archive,
            )).to.be.ok;
          });

          it('should not create a new cache if the cache already exists', async () => {
            const depA = await A.unityPackage()
              .withName('dep-a')
              .build();

            const unityPackage = await A.unityPackage()
              .withName(packageData.name)
              .withDependency(depA.config.name, depA.config.version.toString())
              .build();

            setPackageServiceGetResponse([unityPackage, depA]);

            await cmd.action(unityPackage.config.name);
            await cmd.action(depA.config.name);

            await unityPackage.deleteProject();
            await depA.deleteProject();

            expect(stubServiceCacheSet.getCalls().length).to.eq(2);
          });

          it('should use the cache if a package is re-installed', async () => {
            stubServiceCacheSet.callThrough();
            const stubTarExtract = sinon.stub(tar, 'extract');

            const unityPackage = await A.unityPackage()
              .withName(packageData.name)
              .build();

            setPackageServiceGetResponse([unityPackage]);

            await cmd.action(packageData.name);
            const cacheData = await serviceCache.getPackageVersion(packageData.name, '1.0.0');

            // Delete all data
            while (config.dependencies.packages.length) {
              config.dependencies.packages.pop();
            }

            const outputPath = `${unityProject.root}/${config.dependencies.outputFolder}`;
            rimraf.sync(outputPath);

            // Install assuming successful cache usage
            await cmd.action(packageData.name);

            stubTarExtract.restore();

            await unityPackage.deleteProject();

            expect(stubTarExtract.calledWith({
              file: cacheData.archivePath,
              cwd: `${outputPath}/${packageData.name}`,
            })).to.be.ok;
          });
        });

        it('should recover if cache set fails', async () => {
          stubServiceCacheSet.callsFake(() => {
            // @ts-ignore
            return new Promise((resolve, reject) => reject());
          });

          const unityPackage = await A.unityPackage()
            .withName(packageData.name)
            .build();

          setPackageServiceGetResponse([unityPackage]);

          await cmd.action(packageData.name);

          await unityPackage.deleteProject();
        });

        it('should log an error if cache set fails', async () => {
          const errMsg = 'Failure';

          stubServiceCacheSet.callsFake(() => {
            // @ts-ignore
            return new Promise((resolve, reject) => reject(errMsg));
          });

          const unityPackage = await A.unityPackage()
            .withName(packageData.name)
            .build();

          setPackageServiceGetResponse([unityPackage]);

          await cmd.action(packageData.name);

          await unityPackage.deleteProject();

          expect(cmd.logError.lastEntry).to.eq(`Cache Error: ${errMsg}`);
        });

        it('should recover if cache get fails', async () => {
          sinon.stub(serviceCache, 'hasPackageVersion').callsFake(() => {
            return new Promise((resolve) => resolve(true));
          });

          sinon.stub(serviceCache, 'getPackageVersion').callsFake(() => {
            // @ts-ignore
            return new Promise((resolve, reject) => reject());
          });

          const unityPackage = await A.unityPackage()
            .withName(packageData.name)
            .build();

          let errCaught: boolean = false;
          try {
            setPackageServiceGetResponse([unityPackage]);
            await cmd.action(packageData.name);
          } catch (err) {
            errCaught = true;
          }

          await cmd.action(packageData.name);

          expect(errCaught).to.be.not.ok;
        });
      });
    });

    describe('uvpm install', () => {
      const parentPackage = 'my-package';

      it('should delete all pre-existing packages in the output folder', async () => {
        const spyRimRafSync = sinon.stub(rimraf, 'sync').callThrough();
        const outputPath = `${unityProject.root}/${config.dependencies.outputFolder}`;

        await cmd.action();

        spyRimRafSync.restore();

        expect(spyRimRafSync.calledWith(outputPath)).to.be.ok;
      });

      it('should install all packages listed in the config', async () => {
        const depA = await A.unityPackage()
          .withName('dep-a')
          .build();

        const depB = await A.unityPackage()
          .withName('dep-b')
          .build();

        const unityPackage = await A.unityPackage()
          .withDependency(depA.config.name, depA.config.version.toString())
          .withDependency(depB.config.name, depB.config.version.toString())
          .withName(parentPackage)
          .build();

        config.dependencies.packages.push({
          name: unityPackage.config.name,
          version: unityPackage.config.version.toString(),
        });

        const dependencyNames = [depA.config.name, depB.config.name, unityPackage.config.name];
        setPackageServiceGetResponse([depA, depB, unityPackage]);

        await cmd.action();

        const installedPackageFolders = fs.readdirSync(outputLocation);

        await depA.deleteProject();
        await depB.deleteProject();
        await unityPackage.deleteProject();

        dependencyNames.forEach((d) => {
          expect(installedPackageFolders).to.contain(d);
        });
      });

      describe('special symbols', () => {
        let unityPackage: ExampleProjectUnity;

        beforeEach(async () => {
          unityPackage = await A.unityPackage()
            .withName(parentPackage)
            .build();
        });

        afterEach(async () => {
          await unityPackage.deleteProject();
        });

        describe('config dependency with a ^ symbol in front of the version', () => {
          beforeEach(async () => {
            config.dependencies.packages.push({
              name: unityPackage.config.name,
              version: `^${unityPackage.config.version.toString()}`,
            });
          });

          it('should install normally with no other versions', async () => {
            setPackageServiceGetResponse([unityPackage]);

            await cmd.action();

            const configText = fs.readFileSync(`${outputLocation}/${unityPackage.config.name}/uvpm.json`).toString();
            const packageConfig = new ModelUvpmConfig(JSON.parse(configText));

            expect(packageConfig.version.toString())
              .to.eq(unityPackage.config.version.toString());
          });

          it('should install a minor version when available', async () => {
            const unityPackageMinor = await A.unityPackage()
              .withName(parentPackage)
              .withVersion('1.1.0')
              .build();

            setPackageServiceGetResponse([unityPackage, unityPackageMinor]);

            await cmd.action();

            const configText = fs.readFileSync(`${outputLocation}/${unityPackage.config.name}/uvpm.json`).toString();
            const packageConfig = new ModelUvpmConfig(JSON.parse(configText));

            await unityPackageMinor.deleteProject();

            expect(packageConfig.version.toString())
              .to.eq(unityPackageMinor.config.version.toString());
          });

          it('should install a patch version when available', async () => {
            const unityPackagePatch = await A.unityPackage()
              .withName(parentPackage)
              .withVersion('1.0.1')
              .build();

            setPackageServiceGetResponse([unityPackage, unityPackagePatch]);

            await cmd.action();

            const configText = fs.readFileSync(`${outputLocation}/${unityPackage.config.name}/uvpm.json`).toString();
            const packageConfig = new ModelUvpmConfig(JSON.parse(configText));

            await unityPackagePatch.deleteProject();

            expect(packageConfig.version.toString())
              .to.eq(unityPackagePatch.config.version.toString());
          });

          it('should install the latest minor version if multiple are available', async () => {
            const unityPackageMinor = await A.unityPackage()
              .withName(parentPackage)
              .withVersion('1.2.0')
              .build();

            const unityPackageMinorOld = await A.unityPackage()
              .withName(parentPackage)
              .withVersion('1.1.0')
              .build();

            setPackageServiceGetResponse([unityPackage, unityPackageMinorOld, unityPackageMinor]);

            await cmd.action();

            const configText = fs.readFileSync(`${outputLocation}/${unityPackage.config.name}/uvpm.json`).toString();
            const packageConfig = new ModelUvpmConfig(JSON.parse(configText));

            await unityPackageMinor.deleteProject();
            await unityPackageMinorOld.deleteProject();

            expect(packageConfig.version.toString())
              .to.eq(unityPackageMinor.config.version.toString());
          });

          it('should install the latest patch version when multiple minor versions are available', async () => {
            const unityPackageMinor = await A.unityPackage()
              .withName(parentPackage)
              .withVersion('1.1.2')
              .build();

            const unityPackageMinorOld = await A.unityPackage()
              .withName(parentPackage)
              .withVersion('1.1.1')
              .build();

            setPackageServiceGetResponse([unityPackage, unityPackageMinorOld, unityPackageMinor]);

            await cmd.action();

            const configText = fs.readFileSync(`${outputLocation}/${unityPackage.config.name}/uvpm.json`).toString();
            const packageConfig = new ModelUvpmConfig(JSON.parse(configText));

            await unityPackageMinor.deleteProject();
            await unityPackageMinorOld.deleteProject();

            expect(packageConfig.version.toString())
              .to.eq(unityPackageMinor.config.version.toString());
          });

          it('should not install a major release upgrade if it\'s available', async () => {
            const unityPackageMinor = await A.unityPackage()
              .withName(parentPackage)
              .withVersion('1.2.0')
              .build();

            const unityPackageMajor = await A.unityPackage()
              .withName(parentPackage)
              .withVersion('2.0.0')
              .build();

            setPackageServiceGetResponse([unityPackage, unityPackageMajor, unityPackageMinor]);

            await cmd.action();

            const configText = fs.readFileSync(`${outputLocation}/${unityPackage.config.name}/uvpm.json`).toString();
            const packageConfig = new ModelUvpmConfig(JSON.parse(configText));

            await unityPackageMinor.deleteProject();
            await unityPackageMajor.deleteProject();

            expect(packageConfig.version.toString())
              .to.eq(unityPackageMinor.config.version.toString());
          });
        });

        describe('config dependency with a ~ symbol in front of the version', () => {
          beforeEach(async () => {
            config.dependencies.packages.push({
              name: unityPackage.config.name,
              version: `~${unityPackage.config.version.toString()}`,
            });
          });

          it('should install normally with no other versions', async () => {
            setPackageServiceGetResponse([unityPackage]);

            await cmd.action();

            const configText = fs.readFileSync(`${outputLocation}/${unityPackage.config.name}/uvpm.json`).toString();
            const packageConfig = new ModelUvpmConfig(JSON.parse(configText));

            expect(packageConfig.version.toString())
              .to.eq(unityPackage.config.version.toString());
          });

          it('should install a patch version when available', async () => {
            const unityPackagePatch = await A.unityPackage()
              .withName(parentPackage)
              .withVersion('1.0.1')
              .build();

            setPackageServiceGetResponse([unityPackage, unityPackagePatch]);

            await cmd.action();

            const configText = fs.readFileSync(`${outputLocation}/${unityPackage.config.name}/uvpm.json`).toString();
            const packageConfig = new ModelUvpmConfig(JSON.parse(configText));

            await unityPackagePatch.deleteProject();

            expect(packageConfig.version.toString())
              .to.eq(unityPackagePatch.config.version.toString());
          });

          it('should install the latest patch version if multiple are available', async () => {
            const unityPackageMinor = await A.unityPackage()
              .withName(parentPackage)
              .withVersion('1.0.2')
              .build();

            const unityPackageMinorOld = await A.unityPackage()
              .withName(parentPackage)
              .withVersion('1.0.1')
              .build();

            setPackageServiceGetResponse([unityPackage, unityPackageMinorOld, unityPackageMinor]);

            await cmd.action();

            const configText = fs.readFileSync(`${outputLocation}/${unityPackage.config.name}/uvpm.json`).toString();
            const packageConfig = new ModelUvpmConfig(JSON.parse(configText));

            await unityPackageMinor.deleteProject();
            await unityPackageMinorOld.deleteProject();

            expect(packageConfig.version.toString())
              .to.eq(unityPackageMinor.config.version.toString());
          });

          it('should not install a minor release upgrade if it\'s available', async () => {
            const unityPackagePatch = await A.unityPackage()
              .withName(parentPackage)
              .withVersion('1.0.1')
              .build();

            const unityPackageMinor = await A.unityPackage()
              .withName(parentPackage)
              .withVersion('1.1.0')
              .build();

            setPackageServiceGetResponse([unityPackage, unityPackageMinor, unityPackagePatch]);

            await cmd.action();

            const configText = fs.readFileSync(`${outputLocation}/${unityPackage.config.name}/uvpm.json`).toString();
            const packageConfig = new ModelUvpmConfig(JSON.parse(configText));

            await unityPackagePatch.deleteProject();
            await unityPackageMinor.deleteProject();

            expect(packageConfig.version.toString())
              .to.eq(unityPackagePatch.config.version.toString());
          });

          it('should not install a major release upgrade if it\'s available', async () => {
            const unityPackagePatch = await A.unityPackage()
              .withName(parentPackage)
              .withVersion('1.0.1')
              .build();

            const unityPackageMajor = await A.unityPackage()
              .withName(parentPackage)
              .withVersion('2.0.0')
              .build();

            setPackageServiceGetResponse([unityPackage, unityPackageMajor, unityPackagePatch]);

            await cmd.action();

            const configText = fs.readFileSync(`${outputLocation}/${unityPackage.config.name}/uvpm.json`).toString();
            const packageConfig = new ModelUvpmConfig(JSON.parse(configText));

            await unityPackagePatch.deleteProject();
            await unityPackageMajor.deleteProject();

            expect(packageConfig.version.toString())
              .to.eq(unityPackagePatch.config.version.toString());
          });
        });
      });

      it('should recover from errors', async () => {
        config.dependencies.packages.push({
          name: 'non-existent-package',
          version: '1.0.0',
        });

        try {
          await cmd.action();
        } finally {
          expect(cmd.logError.lastEntry).to.contain('Package non-existent-package does not exist, skipping install');
        }
      });
    });
  });
});
