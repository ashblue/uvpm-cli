import { config } from '../config';
const PouchDB = require('pouchdb-node');

beforeEach(async () => {
  return await new PouchDB(config.dbId).destroy();
});
