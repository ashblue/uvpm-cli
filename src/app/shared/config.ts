class Config {
  public ENV_TEST = 'TEST';

  /**
   * Check if this is the testing environment
   */
  public isEnvTest () {
    return process.env[this.ENV_TEST] === 'true';
  }
}

export const config = new Config();
