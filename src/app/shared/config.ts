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
}

export const config = new Config();
