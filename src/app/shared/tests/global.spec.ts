import { ModelProfile } from '../models/profile/profile.model';
const PouchDB = require('pouchdb-node');

beforeEach(async () => {
  return await new PouchDB(ModelProfile.dbName).destroy();
});
