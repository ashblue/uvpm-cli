import { getInstalledPath } from 'get-installed-path';

class Config {
  public ENV_TEST = 'TEST';

  /**
   * ID of the database for testing
   * @type {string}
   */
  private DB_ID_TEST = '.db-test';

  /**
   * ID of the production database
   * @type {string}
   */
  private DB = '.db';

  public get dbId () {
    /* istanbul ignore else */
    if (this.isEnvTest) {
      return this.DB_ID_TEST;
    }

    /* istanbul ignore next */
    return this.DB;
  }

  /**
   * Check if this is the testing environment
   */
  public get isEnvTest () {
    return process.env[this.ENV_TEST] === 'true';
  }

  public getfolderRoot (): Promise<string> {
    return new Promise<string>((resolve) => {
      this._getInstalledPath('uvpm-cli')
        .then((path) => {
          resolve(path);
        })
        .catch(() => {
          const targetPath = 'uvpm-cli';
          const rootPath = __dirname.substring(0, __dirname.indexOf('uvpm-cli') + targetPath.length);
          resolve(rootPath);
        });
    });
  }

  /**
   * Overridable stub method for testing getInstalledPath
   * @param {string} pack
   * @param opts
   * @returns {Promise<string>}
   * @private
   */
  // istanbul ignore next
  public _getInstalledPath (pack: string, opts?: any): Promise<string> {
    return getInstalledPath(pack, opts);
  }
}

export const config = new Config();
