import * as tmp from 'tmp';
import { SynchrounousResult } from 'tmp';
import rimraf = require('rimraf');

/**
 * Generate and clear .tmp folder
 */
export class ServiceTmp {
  private _tmpFolder: SynchrounousResult|undefined;

  public get tmpFolder (): string {
    if (this._tmpFolder) {
      return this._tmpFolder.name;
    }

    return '';
  }

  public create () {
    this.clear();

    this._tmpFolder = tmp.dirSync();
  }

  public clear () {
    if (this._tmpFolder) {
      rimraf.sync(this.tmpFolder);
      this._tmpFolder = undefined;
    }
  }
}

export const serviceTmp = new ServiceTmp();
