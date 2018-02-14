import { ServiceDatabase } from '../../services/database/database.service';

beforeEach(async () => {
  return await new ServiceDatabase().destroy();
});
