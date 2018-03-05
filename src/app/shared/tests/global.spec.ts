import { ServiceDatabase } from '../../services/database/database.service';
import { serviceTmp } from '../../services/tmp/tmp.service';

beforeEach(async () => {
  await new ServiceDatabase().destroy();
  serviceTmp.create();
});

afterEach( () => {
  serviceTmp.clear();
});
