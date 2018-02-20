import { ExampleProjectUnity } from './example-project-unity';
import * as chai from 'chai';
import * as fs from 'fs';
import { IFile } from '../i-file';
import { unityExampleProjectFiles } from './unity-example-project-files';

const expect = chai.expect;

function verifyFiles (rootPath: string, files: IFile[]) {
  files.forEach((f) => {
    let path = rootPath;
    if (f.path !== '' && f.path) {
      path += `/${f.path}`;
    }

    path += `/${f.file}`;

    expect(fs.existsSync(path)).to.be.ok;

    if (f.contents) {
      const contents = fs.readFileSync(path).toString();
      expect(contents).to.eq(f.contents);
    }
  });
}

describe('ExampleProjectUnity', () => {
  it('should initialize', () => {
    const example = new ExampleProjectUnity();

    expect(example).to.be.ok;
  });

  it('should inject a default config file for the project', () => {
    const name = 'my-unity-project';
    const author = 'Ash Blue';
    const description = 'An example Unity project';
    const testFolder = 'Assets/MyProject/Testing';
    const exampleFolder = 'Assets/MyProject/Examples';
    const unityVersionMin = '5.6';

    const example = new ExampleProjectUnity();

    expect(example.config.name).to.eq(name);
    expect(example.config.author).to.eq(author);
    expect(example.config.description).to.eq(description);
    expect(example.config.publishing.tests.find((path: string) => path === testFolder)).to.eq(testFolder);
    expect(example.config.publishing.examples.find((path: string) => path === exampleFolder)).to.eq(exampleFolder);
    expect(example.config.publishing.unityVersion.min).to.eq(unityVersionMin);
  });

  it('should allow overriding pieces of the config files', () => {
    const unityVersionMin = '5.2';

    const example = new ExampleProjectUnity((config) => {
      config.publishing.unityVersion.min = unityVersionMin;
    });

    expect(example.config.publishing.unityVersion.min).to.eq(unityVersionMin);
  });

  it('should generate a Unity project', async () => {
    const example = new ExampleProjectUnity();
    await example.createProject();

    verifyFiles(example.root, unityExampleProjectFiles);
  });

  it('should allow appending new generated files', async () => {
    const newFiles: IFile[] = [
      {
        file: 'test-file.txt',
      },
    ];

    const example = new ExampleProjectUnity(
      undefined,
      newFiles,
    );

    await example.createProject();

    verifyFiles(example.root, unityExampleProjectFiles.concat(newFiles));
  });
});
