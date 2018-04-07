import { CmdInit } from './init.cmd';
import { StubInquirer } from '../../../shared/stubs/stub-inquirer';
import { IUvpmConfig } from '../../../shared/interfaces/uvpm/config/i-uvpm-config';
import { configDefaults, ModelUvpmConfig } from '../../../models/uvpm/uvpm-config.model';

import * as fs from 'fs';
import * as chai from 'chai';
import { ModelVersion } from '../../../models/version/version.model';
import { ServiceDatabase } from '../../../services/database/database.service';
import { ModelProfile } from '../../../models/profile/profile.model';
import { ServicePackageVersions } from '../../../services/package-versions/package-versions.service';
import { ServicePackages } from '../../../services/packages/packages.service';
import { A } from '../../../shared/tests/builder/a';
import { ServiceAxios } from '../../../services/axios/axios.service';

const expect = chai.expect;

describe('CmdInit', () => {
  let cmdInit: CmdInit;
  let db: ServiceDatabase;
  let config: ModelUvpmConfig;
  let stubInquirer: StubInquirer;
  let profile: ModelProfile;
  let servicePackages: ServicePackages;
  let servicePackageVersions: ServicePackageVersions;

  beforeEach(async () => {
    db = new ServiceDatabase();
    profile = new ModelProfile(db);
    stubInquirer = new StubInquirer();
    config = new ModelUvpmConfig();

    const serviceAxis = new ServiceAxios(profile);
    servicePackages = new ServicePackages(profile, serviceAxis);
    servicePackageVersions = new ServicePackageVersions(profile, serviceAxis);

    cmdInit = A.command()
      .withServiceDatabase(db)
      .withModelProfile(profile)
      .withModelUvpmConfig(config)
      .withInquirer(stubInquirer as any)
      .withServicePackages(servicePackages)
      .withServicePackageVersions(servicePackageVersions)
      .build(CmdInit);
  });

  it('should initialize', () => {
    expect(cmdInit).to.be.ok;
  });

  describe('when run', () => {
    afterEach(() => {
      if (fs.existsSync(`./${ModelUvpmConfig.fileName}`)) {
        fs.unlinkSync(`./${ModelUvpmConfig.fileName}`);
      }
    });

    it('should generate a file based upon answers', async () => {
      const answers = {
        name: 'Unity Animator Helpers',
        version: '2.0.0',
        description: 'My custom description here',
        author: 'Ash Blue',
        license: 'None',
      };

      stubInquirer.answers = answers;
      expect(cmdInit).to.be.ok;
      await cmdInit.action();

      const contents = fs.readFileSync(`./${ModelUvpmConfig.fileName}`);
      expect(contents).to.be.ok;

      const configData = JSON.parse(contents.toString()) as IUvpmConfig;
      expect(configData).to.be.ok;
      expect(configData.name).to.contain(answers.name);
      expect(configData.version).to.eq(answers.version);
      expect(configData.description).to.contain(answers.description);
      expect(configData.author).to.contain(answers.author);
      expect(configData.license).to.contain(answers.license);
    });

    it('should generate default values if blank answers are provided', async () => {
      const answers = {
        name: null,
        version: '',
        description: null,
        author: undefined,
        license: undefined,
      };

      stubInquirer.answers = answers;
      expect(cmdInit).to.be.ok;
      await cmdInit.action();

      const contents = fs.readFileSync(`./${ModelUvpmConfig.fileName}`);
      expect(contents).to.be.ok;

      const configData = JSON.parse(contents.toString()) as IUvpmConfig;
      configData.version = new ModelVersion(configData.version as string);

      expect(configData).to.be.ok;
      expect(configData.name).to.eq('');
      expect(configData.version.toString()).to.eq(configDefaults.version);
      expect(configData.description).to.eq('');
      expect(configData.author).to.eq('');
      expect(configData.license).to.eq(configDefaults.license);
    });

    it('should generate a standard version number if an invalid one is provided', async () => {
      const answers = {
        name: null,
        version: 'asdf',
        description: null,
        author: undefined,
        license: undefined,
      };

      stubInquirer.answers = answers;
      await cmdInit.action();
      const contents = fs.readFileSync(`./${ModelUvpmConfig.fileName}`);
      const configData = JSON.parse(contents.toString()) as IUvpmConfig;

      expect(configData).to.be.ok;
      expect(configData.version).to.be.ok;
      expect(configData.version).to.eq(configDefaults.version.toString());
    });

    it('should fail if a uvpm.json file already exists', async () => {
      fs.writeFileSync(`./${ModelUvpmConfig.fileName}`, '{}');

      stubInquirer.answers = {};
      expect(cmdInit).to.be.ok;

      await cmdInit.action();

      expect(cmdInit.logError.lastEntry).to.contain(`Cannot overwrite ${ModelUvpmConfig.fileName}`);

      const contents = fs.readFileSync(`./${ModelUvpmConfig.fileName}`).toString();
      expect(contents).to.be.ok;
      expect(contents).to.eq('{}');
    });
  });
});
