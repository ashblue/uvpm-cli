import { CmdBase } from '../../base/base.cmd';
import { HorizontalTable } from 'cli-table2';
import * as CliTable2 from 'cli-table2';
import { IPackageSearchResult } from '../../../shared/interfaces/packages/i-package-search-result';

export class CmdSearch extends CmdBase {
  public get name (): string {
    return 'search [package]';
  }

  public get description (): string {
    return 'Search for a package by name';
  }

  protected get requireServer (): boolean {
    return true;
  }

  protected onAction (name?: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      if (!name) {
        reject('Please provide a package name to search');
        return;
      }

      let result: IPackageSearchResult[];
      try {
        result = await this.servicePackages.search(name);
      } catch (err) {
        reject(err);
        return;
      }

      if (result.length === 0) {
        this.logWarning.print('No search results found. Please try again');
        resolve();
        return;
      }

      const table = this.createTable(result);
      this.log.print(table.toString());

      resolve();
    });
  }

  private createTable (result: IPackageSearchResult[]) {
    const table = new CliTable2({
      head: ['name', 'description', 'author', 'date', 'version'],
    }) as HorizontalTable;

    result.forEach((r) => {
      table.push([r.name, r.description, r.author, r.date, r.version]);
    });

    return table;
  }
}
