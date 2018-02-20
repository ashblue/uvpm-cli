import * as chai from 'chai';
import { ExampleProject } from './example-project';
import * as fs from 'fs';
import { IUvpmConfig } from '../../interfaces/uvpm/config/i-uvpm-config';
import { IFile } from './i-file';

const expect = chai.expect;

function verifyFiles (rootPath: string, files: IFile[]) {
  files.forEach((f) => {
    let path = rootPath;
    if (f.path !== '' && f.path) {
      path += `/${f.path}`;
    }

    path += `/${f.file}`;

    const contents = fs.readFileSync(path).toString();

    expect(fs.existsSync(path)).to.be.ok;
    if (f.contents) {
      expect(contents).to.eq(f.contents);
    }
  });
}

describe('ExampleProject', () => {
  const defaultConfig: IUvpmConfig = {
    name: 'example',
  };

  it('should initialize', () => {
    const example = new ExampleProject(defaultConfig);

    expect(example).to.be.ok;
  });

  describe('createProject', () => {
    it('should use the uvpm.json package name as the folder root name', () => {
      const example = new ExampleProject(defaultConfig);
      const path = `${example.root}`;

      example.createProject();

      expect(example).to.be.ok;
      expect(fs.existsSync(path)).to.be.ok;
    });

    it('should spawn a uvpm.json file in the root', () => {
      const example = new ExampleProject(defaultConfig);
      const path = `${example.root}/uvpm.json`;

      example.createProject();

      expect(example).to.be.ok;
      expect(fs.existsSync(path)).to.be.ok;
    });
  });

  it('should turn a list of files, paths, and content into a hierarchy', () => {
    const fileRoot: IFile = {
      file: 'hello-world.txt',
      path: '',
      contents: 'Hello world',
    };

    const fileRootSibling: IFile = {
      file: 'sibling.txt',
      path: './',
      contents: 'Sibling',
    };

    const fileInFolder: IFile = {
      file: 'file-in-folder.txt',
      path: 'custom-folder',
      contents: 'Lorem Ipsum',
    };

    const fileNested: IFile = {
      file: 'nested-file.txt',
      path: 'nested/folder',
      contents: 'I\'m a nested file',
    };

    const files: IFile[] = [fileRoot, fileRootSibling, fileInFolder, fileNested];
    const example = new ExampleProject(defaultConfig, files);

    verifyFiles(example.root, files);
  });

  it('should generate files with a minimal syntax', () => {
    const file: IFile = {
      file: 'hello-world.txt',
    };

    const fileContent: IFile = {
      file: 'sibling.txt',
      contents: 'Sibling',
    };

    const filePath: IFile = {
      file: 'file-in-folder.txt',
      path: 'custom-folder',
    };

    const files: IFile[] = [file, fileContent, filePath];
    const example = new ExampleProject(defaultConfig, files);

    verifyFiles(example.root, files);
  });
});
