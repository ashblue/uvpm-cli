import { ServiceDatabase } from '../../services/database/database.service';
import * as fs from 'fs';
import { config } from '../config';
import * as rimraf from 'rimraf';

beforeEach(() => {
  if (!fs.existsSync(config.TMP_FOLDER)) {
    fs.mkdirSync(config.TMP_FOLDER);
  }
});

afterEach(async () => {
  if (fs.existsSync(config.TMP_FOLDER)) {
    rimraf.sync(config.TMP_FOLDER);
  }

  await new ServiceDatabase().destroy();
});
