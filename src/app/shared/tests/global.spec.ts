import { ServiceDatabase } from '../../services/database/database.service';
import { serviceTmp } from '../../services/tmp/tmp.service';

beforeEach(() => {
  serviceTmp.create();
});

afterEach(async () => {
  serviceTmp.clear();

  await new ServiceDatabase().destroy();
});
