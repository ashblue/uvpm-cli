import { ServicePackageVersions } from '../../../services/package-versions/package-versions.service';
import { ModelProfile } from '../../../models/profile/profile.model';
import { ServicePackages } from '../../../services/packages/packages.service';
import { ServiceDatabase } from '../../../services/database/database.service';
import { Command } from 'commander';
import * as inquirer from 'inquirer';
import { ModelUvpmConfig } from '../../../models/uvpm/uvpm-config.model';
import { SinonStub } from 'sinon';
import { CmdUnpublish } from './unpublish.cmd';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { Answers, Question } from 'inquirer';
import { IUnpublishAnswers } from './i-unpublish-answers';

describe('CmdPublish', () => {
  let db: ServiceDatabase;
  let profile: ModelProfile;
  let config: ModelUvpmConfig;
  let servicePackages: ServicePackages;
  let servicePackageVersions: ServicePackageVersions;
  let cmd: CmdUnpublish;
  let answers: IUnpublishAnswers;

  let stubIsFile: SinonStub;
  let stubInquirer: SinonStub;
  let stubServicePackagesDelete: SinonStub;
  let stubServicePackageVersionsDelete: SinonStub;

  let questions: any;

  beforeEach(() => {
    questions = [
      {
        type: 'input',
        name: 'packageName',
        message: 'Are you sure you want to delete this package? If so please type this package\'s name',
      },
      {
        type: 'input',
        name: 'confirmYes',
        message: 'This will delete the entire package for good and all associated versions.' +
        ' Are you sure you want to do this? Type "yes" to continue',
      },
    ];
  });

  beforeEach(async () => {
    db = new ServiceDatabase();
    profile = new ModelProfile(db);
    profile.server = 'http://uvpm.com';
    profile.email = 'asdf@asdf.com';
    profile.token = '34l2j3jkl@34jkkj3';

    config = new ModelUvpmConfig();
    config.name = 'my-project';

    servicePackages = new ServicePackages(profile);
    servicePackageVersions = new ServicePackageVersions(profile);

    stubIsFile = sinon.stub(config, 'isFile')
      .get(() => true);

    stubServicePackageVersionsDelete = sinon.stub(servicePackageVersions, 'delete')
      .callsFake(() => {
        return new Promise((resolve) => resolve());
      });

    stubServicePackagesDelete = sinon.stub(servicePackages, 'delete')
      .callsFake(() => {
        return new Promise((resolve) => resolve());
      });

    cmd = new CmdUnpublish(db, profile, config, new Command(), inquirer, servicePackages, servicePackageVersions);
  });

  beforeEach(() => {
    answers = {
      packageName: config.name,
      confirmYes: 'yes',
    };

    stubInquirer = sinon.stub(inquirer, 'prompt')
      .callsFake(() => {
        return new Promise<Answers>((resolve) => resolve(answers));
      });
  });

  afterEach(() => {
    stubIsFile.restore();
    stubInquirer.restore();
    stubServicePackagesDelete.restore();
  });

  it('should initialize', () => {
    expect(cmd).to.be.ok;
  });

  it('should fail if the user is not logged in', async () => {
    const errMsg = 'Please login before using this action';

    profile.email = undefined as any;
    profile.token = undefined as any;
    await cmd.action();

    expect(cmd.lastLogErr).to.contain(errMsg);
  });

  it('should fail if the server is not set', async () => {
    const errMsg = 'Please set a server before using this action';

    profile.server = null;
    await cmd.action();

    expect(cmd.lastLogErr).to.contain(errMsg);
  });

  it('should fail if uvpm.json is not present', async () => {
    const errMsg = 'Please create a uvpm.json file';

    stubIsFile.get(() => false);
    await cmd.action();

    expect(cmd.lastLogErr).to.contain(errMsg);
  });

  describe('uvpm unpublish', () => {
    it('should fail when called', async () => {
      await cmd.action();

      expect(cmd.lastLogErr).to.eq('You must call unpublish with a package and version,' +
        ' "uvpm unpublish PACKAGE [VERSION]"');
    });
  });

  describe('uvpm unpublish', () => {
    it('should ask the user if they want to delete the package', async () => {
      await cmd.action(config.name);

      const questionArgs = stubInquirer.getCall(0).args[0][0] as Question;

      expect(questionArgs).to.deep.eq(questions[0]);
    });

    it('should fail if the user does not type the package name', async () => {
      answers.packageName = '';

      await cmd.action(config.name);

      expect(cmd.lastLogErr).to.eq('Package name was not confirmed');
    });

    it('should make the user type the name of the package to delete it', async () => {
      answers.packageName = config.name;

      await cmd.action(config.name);

      expect(cmd.lastLogErr).to.not.eq('Package name was not confirmed');
    });

    it('should ask the user if they\'re sure they want to delete the' +
      ' entire package and all version data', async () => {
      await cmd.action(config.name);

      const questionArgs = stubInquirer.getCall(0).args[0][1] as Question;

      expect(questionArgs).to.deep.eq(questions[1]);
    });

    it('should fail if the user does not confirm again by typing yes', async () => {
      answers.confirmYes = '';

      await cmd.action(config.name);

      expect(cmd.lastLogErr).to.eq('Failed to unpublish. Did not receive a yes');
    });

    it('should make the user verify again by typing yes', async () => {
      await cmd.action(config.name);

      expect(cmd.lastLogErr).to.not.be.ok;
    });

    it('should call the package delete service', async () => {
      await cmd.action(config.name);

      expect(stubServicePackagesDelete.called).to.be.ok;
    });

    it('should call the package delete service with the package id', async () => {
      await cmd.action(config.name);

      expect(stubServicePackagesDelete.getCall(0).args[0]).to.eq(config.name);
    });

    it('should print a message upon successfully deleting the package', async () => {
      await cmd.action(config.name);

      expect(cmd.lastLog).to.contain(`Package ${config.name} successfully deleted`);
    });

    it('should fail if the delete service returns an error', async () => {
      const errMsg = 'Failed to delete the requested package';

      stubServicePackagesDelete.callsFake(() => {
        // @ts-ignore
        return new Promise((resolve, reject) => {
          reject(errMsg);
        });
      });

      await cmd.action(config.name);

      expect(cmd.lastLogErr).to.eq(errMsg);
    });
  });

  describe('uvpm unpublish [version]', () => {
    const version = '1.0.0';

    beforeEach(() => {
      questions[0].message = 'Are you sure you want to delete this package? If so' +
        ' please type the package as PACKAGE@VERSION. Example my-package@1.0.0';

      answers.packageName = `${config.name}@${config.version}`;
    });

    it('should ask the user to verify the package and version name', async () => {
      await cmd.action(config.name, version);
      const questionArgs = stubInquirer.getCall(0).args[0][0] as Question;

      expect(questionArgs).to.deep.eq(questions[0]);
    });

    it('should fail if the user does not answer with the package and version name', async () => {
      answers.packageName = '';

      await cmd.action(config.name, version);

      expect(cmd.lastLogErr).to.eq('Package name was not confirmed');
    });

    it('should pass if the user answers with the package and version', async () => {
      await cmd.action(config.name, version);

      expect(cmd.lastLogErr).to.not.be.ok;
    });

    it('should warn the user that this will delete the package version', async () => {
      questions[1].message = 'This will delete the package version. Are you sure you want' +
        ' to do this? Type yes to continue';

      await cmd.action(config.name, version);
      const questionArgs = stubInquirer.getCall(0).args[0][1] as Question;

      expect(questionArgs).to.deep.eq(questions[1]);
    });

    it('should call the ServicePackageVersions.delete command', async () => {
      await cmd.action(config.name, version);

      expect(stubServicePackageVersionsDelete.called).to.be.ok;
    });

    it('should pass in the package and version to ServicePackageVersions.delete', async () => {
      await cmd.action(config.name, version);

      expect(stubServicePackageVersionsDelete.getCall(0).args[0]).to.eq(config.name);
      expect(stubServicePackageVersionsDelete.getCall(0).args[1]).to.eq(version);
    });

    it('should fail if the delete service returns an error', async () => {
      const failMessage = 'Failed to delete the requested pacakge';

      stubServicePackageVersionsDelete.callsFake(() => {
        // @ts-ignore
        return new Promise((resolve, reject) => {
          reject(failMessage);
        });
      });

      await cmd.action(config.name, version);

      expect(cmd.lastLogErr).to.eq(failMessage);
    });

    it('should return a message upon success', async () => {
      await cmd.action(config.name, version);

      expect(cmd.lastLog).to.contain(`Package ${config.name}@${version} successfully deleted`);
    });
  });
});
