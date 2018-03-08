import { Answers } from 'inquirer';

export interface IUnpublishAnswers extends Answers {
  packageName?: string;
  confirmYes?: string;
}
