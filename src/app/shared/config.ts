import { getInstalledPathSync } from 'get-installed-path';

class Config {
  public ENV_TEST = 'TEST';

  /**
   * Check if this is the testing environment
   */
  public get isEnvTest () {
    return process.env[this.ENV_TEST] === 'true';
  }

  public get folderRoot (): string {
    let root: string;

    try {
      root = this._getInstalledPath('uvpm-cli');
    } catch {
      const targetPath = 'uvpm-cli';
      root = __dirname.substring(0, __dirname.indexOf('uvpm-cli') + targetPath.length);
    }

    return root;
  }

  /**
   * Overridable stub method for testing getInstalledPath
   * @param {string} pack
   * @param opts
   * @returns {Promise<string>}
   * @private
   */
  // istanbul ignore next
  public _getInstalledPath (pack: string, opts?: any): string {
    return getInstalledPathSync(pack, opts);
  }
}

export const appConfig = new Config();
