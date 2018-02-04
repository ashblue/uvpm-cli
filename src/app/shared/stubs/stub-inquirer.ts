import { Answers } from 'inquirer';

/**
 * Stub for testing inquirer
 */
export class StubInquirer {
  constructor (private answers?: Answers) {
  }

  /**
   * Stubbed method that circumvents inquirer
   * @returns {Promise<inquirer.Answers>}
   */
  public prompt (): Promise<Answers> {
    return new Promise<Answers>((resolve) => {
      resolve(this.answers);
    });
  }
}
