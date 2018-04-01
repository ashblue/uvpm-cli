import { ServiceDatabase } from '../../services/database/database.service';
import { serviceTmp } from '../../services/tmp/tmp.service';
import rimraf = require('rimraf');
import { ServiceCache } from '../../services/cache/cache.service';

beforeEach(async () => {
  await new ServiceDatabase().destroy();
  serviceTmp.create();
});

afterEach( () => {
  serviceTmp.clear();
  rimraf.sync(ServiceCache.cachePath);
});
