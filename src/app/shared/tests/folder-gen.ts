import * as os from 'os';
import { IFile } from '../interfaces/i-file';
import * as mkdirp from 'mkdirp';
import * as fs from 'fs';
import * as archiver from 'archiver';

/**
 * A helper test class for generation folder structure with files
 */
export class FolderGen {
  public tmp = os.tmpdir();

  constructor (files: IFile[] = []) {
    files.forEach((f) => {
      const path = `${this.tmp}/${f.path}`;
      mkdirp.sync(path);
      fs.writeFileSync(`${path}/${f.file}`, f.contents);
    });
  }

  public toArchive (fileName: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const path = `${this.tmp}/${fileName}`;
      const output = fs.createWriteStream(path);
      const archive = archiver('tar', {
        zlib: {
          level: 9,
        },
        gzip: true,
        gzipOptions: {
          level: 9,
        },
      });

      output.on('close', () => resolve(path));
      archive.on('error', (err) => reject(err));
      archive.pipe(output);
    });
  }
}
