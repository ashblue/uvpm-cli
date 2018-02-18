import * as fs from 'fs';
import * as rimraf from 'rimraf';

/**
 * Generate and clear .tmp folder
 */
export class ServiceTmp {
  private _tmpFolder = '.tmp';

  public get tmpFolder () {
    return this._tmpFolder;
  }

  public create () {
    this.clear();

    fs.mkdirSync(this.tmpFolder);
  }

  public clear () {
    if (fs.existsSync(this.tmpFolder)) {
      rimraf.sync(this.tmpFolder);
    }
  }
}

export const serviceTmp = new ServiceTmp();
