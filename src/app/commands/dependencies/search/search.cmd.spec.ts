import { A } from '../../../shared/tests/builder/a';
import { expect } from 'chai';
import { CmdSearch } from './search.cmd';
import { ModelProfile } from '../../../models/profile/profile.model';
import { ServiceDatabase } from '../../../services/database/database.service';
import { ServicePackages } from '../../../services/packages/packages.service';
import * as sinon from 'sinon';
import { IPackageSearchResult } from '../../../shared/interfaces/packages/i-package-search-result';
import * as CliTable2 from 'cli-table2';
import { HorizontalTable } from 'cli-table2';

describe('CmdSearch', () => {
  let cmd: CmdSearch;
  let profile: ModelProfile;
  let db: ServiceDatabase;
  let servicePackages: ServicePackages;

  beforeEach(() => {
    db = new ServiceDatabase();
    profile = new ModelProfile(db);
    servicePackages = new ServicePackages(profile);

    cmd = A.command()
      .withServiceDatabase(db)
      .withModelProfile(profile)
      .withServicePackages(servicePackages)
      .build(CmdSearch);
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

  describe('search [package]', () => {
    const packageName = 'my-package';

    beforeEach(() => {
      profile.server = 'http://uvpm.com';
    });

    describe('success', () => {
      it('should call the servicePackages.search API with the package name', async () => {
        const result: IPackageSearchResult = {
          name: packageName,
          description: 'My description',
          author: 'Ash Blue',
          date: Date.now(),
          version: '1.0.0',
        };

        const stubSearch = sinon.stub(servicePackages, 'search')
          .callsFake(() => {
            return new Promise<IPackageSearchResult[]>((resolve) => resolve([result]));
          });

        await cmd.action(packageName);

        expect(stubSearch.called).to.be.ok;
      });

      it('should print the search results into a CLI Table', async () => {
        const result: IPackageSearchResult = {
          name: packageName,
          description: 'My description',
          author: 'Ash Blue',
          date: Date.now(),
          version: '1.0.0',
        };

        sinon.stub(servicePackages, 'search')
          .callsFake(() => {
            return new Promise<IPackageSearchResult[]>((resolve) => resolve([result]));
          });

        const table = new CliTable2({
          head: ['name', 'description', 'author', 'date', 'version'],
        }) as HorizontalTable;

        table.push([result.name, result.description, result.author, result.date, result.version]);

        await cmd.action(packageName);

        expect(cmd.log.lastEntry).to.eq(table.toString());
      });

      it('should print a warning if no search results were returned', async () => {
        sinon.stub(servicePackages, 'search')
          .callsFake(() => {
            return new Promise<IPackageSearchResult[]>((resolve) => {
              resolve([]);
            });
          });

        await cmd.action(packageName);

        expect(cmd.logWarning.lastEntry).to.eq('No search results found. Please try again');
      });
    });

    it('should fail if no package name is provided', async () => {
      await cmd.action();

      expect(cmd.logError.lastEntry).to.eq('Please provide a package name to search');
    });

    it('should print an error if the package service search method fails', async () => {
      const errorMessage = '404 not found';
      sinon.stub(servicePackages, 'search')

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
