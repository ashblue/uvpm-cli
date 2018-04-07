import { A } from '../../../shared/tests/builder/a';
import { expect } from 'chai';
import { ModelProfile } from '../../../models/profile/profile.model';
import { ServiceDatabase } from '../../../services/database/database.service';
import { ServicePackages } from '../../../services/packages/packages.service';
import * as sinon from 'sinon';
import { IPackageSearchResult } from '../../../shared/interfaces/packages/i-package-search-result';
import { CmdView } from './view.cmd';
import { IPackage } from '../../../shared/interfaces/packages/i-package';
import chalk from 'chalk';
import { ServiceAxios } from '../../../services/axios/axios.service';

describe('CmdView', () => {
  let cmd: CmdView;
  let profile: ModelProfile;
  let db: ServiceDatabase;
  let servicePackages: ServicePackages;

  beforeEach(() => {
    db = new ServiceDatabase();
    profile = new ModelProfile(db);

    const serviceAxis = new ServiceAxios(profile);
    servicePackages = new ServicePackages(profile, serviceAxis);

    cmd = A.command()
      .withServiceDatabase(db)
      .withModelProfile(profile)
      .withServicePackages(servicePackages)
      .build(CmdView);
  });

  it('should initialize', () => {
    expect(cmd).to.be.ok;
  });

  describe('missing data failures', () => {
    it('should fail if a server has not been set', async () => {
      const errMsg = 'Please set a server before using this action';

      profile.server = null;
      await cmd.action();

      expect(cmd.logError.lastEntry).to.contain(errMsg);
    });
  });

  describe('view [package]', () => {
    const packageName = 'my-package';

    beforeEach(() => {
      profile.server = 'http://uvpm.com';
    });

    describe('success', () => {
      it('should call the servicePackages.get API with the package name', async () => {
        const result: IPackage = {
          name: packageName,
          author: {
            name: 'Ash Blue',
            email: 'joe@blah.com',
          },
          versions: [],
        };

        const stubGet = sinon.stub(servicePackages, 'get')
          .callsFake(() => {
            return new Promise<IPackage>((resolve) => resolve(result));
          });

        await cmd.action(packageName);

        expect(stubGet.called).to.be.ok;
      });

      it('should print the package name', async () => {
        const result: IPackage = {
          name: packageName,
          author: {
            name: 'Ash Blue',
            email: 'joe@blah.com',
          },
          versions: [],
        };

        sinon.stub(servicePackages, 'get')
          .callsFake(() => {
            return new Promise<IPackage>((resolve) => resolve(result));
          });

        await cmd.action(packageName);

        expect(cmd.log.history).to.contain(chalk.bold(chalk.gray(`Package: ${packageName}`)));
      });

      it('should print the package versions', async () => {
        const result: IPackage = {
          name: packageName,
          author: {
            name: 'Ash Blue',
            email: 'joe@blah.com',
          },
          versions: [
            {
              name: '1.0.0',
              archive: '',
            },
            {
              name: '1.1.0',
              archive: '',
            },
          ],
        };

        sinon.stub(servicePackages, 'get')
          .callsFake(() => {
            return new Promise<IPackage>((resolve) => resolve(result));
          });

        await cmd.action(packageName);

        result.versions.forEach((v) => {
          expect(cmd.log.history).to.contain(chalk.gray(`* ${v.name}`));
        });
      });
    });

    it('should fail if no package name is provided', async () => {
      await cmd.action();

      expect(cmd.logError.lastEntry).to.eq('Please provide a package name to view a package');
    });

    it('should print an error if the package service get method fails', async () => {
      const errorMessage = '404 not found';
      sinon.stub(servicePackages, 'get')
        .callsFake(() => {
          // @ts-ignore
          return new Promise<IPackageSearchResult[]>((resolve, reject) => {
            reject(errorMessage);
          });
        });

      await cmd.action(packageName);

      expect(cmd.logError.lastEntry).to.eq(errorMessage);
    });
  });
});
