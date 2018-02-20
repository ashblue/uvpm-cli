import { ExampleProject } from '../example-project';
import { IFile } from '../i-file';
import { unityExampleProjectFiles } from './unity-example-project-files';
import { ModelUvpmConfig } from '../../../../models/uvpm/uvpm-config.model';

/**
 * Generates a pre-made Unity project
 */
export class ExampleProjectUnity extends ExampleProject {
  constructor (
    configOverride?: (config: ModelUvpmConfig) => void,
    files?: IFile[],
  ) {
    const defaultConfig = new ModelUvpmConfig({
      name: 'my-unity-project',
      author: 'Ash Blue',
      description: 'An example Unity project',
    });

    defaultConfig.publishing.tests.push('Assets/MyProject/Testing');
    defaultConfig.publishing.examples.push('Assets/MyProject/Examples');
    defaultConfig.publishing.unityVersion.min = '5.6';

    if (configOverride) {
      configOverride(defaultConfig);
    }

    super(defaultConfig, files);
  }

  protected createFiles (files?: IFile[]) {
    let allFiles: IFile[] = [];

    if (files) {
      allFiles = allFiles.concat(files);
    }

    allFiles = allFiles.concat(unityExampleProjectFiles);

    super.createFiles(allFiles);
  }
}
