import { A } from '../../../shared/tests/builder/a';
import { expect } from 'chai';
import { CmdCacheClear } from './cache-clear.cmd';
import { ServiceDatabase } from '../../../services/database/database.service';
import { ServiceCache } from '../../../services/cache/cache.service';
import * as tmp from 'tmp';
import * as sinon from 'sinon';

describe('CmdCache', () => {
  let cmd: CmdCacheClear;
  let serviceDatabase: ServiceDatabase;
  let serviceCache: ServiceCache;

  beforeEach(() => {
    serviceDatabase = new ServiceDatabase();
    serviceCache = new ServiceCache(serviceDatabase);

    cmd = A.command()
      .withServiceDatabase(serviceDatabase)
      .withServiceCache(serviceCache)
      .build(CmdCacheClear);
  });

  it('should initialize', () => {
    expect(cmd).to.be.ok;
  });

  describe('uvpm cache-clear', () => {
    it('should run the cache clear command', async () => {
      const stubServiceCacheClear = sinon.stub(serviceCache, 'clear').callThrough();
      await serviceCache.set('my-package', '1.0.0', tmp.fileSync().name);

      await cmd.action();

      expect(stubServiceCacheClear.called).to.be.ok;
    });

    it('should not crash if run without a cache', async () => {
      await cmd.action();
    });
  });
});
