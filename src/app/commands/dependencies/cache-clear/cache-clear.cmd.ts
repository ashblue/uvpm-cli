import { CmdBase } from '../../base/base.cmd';

export class CmdCacheClear extends CmdBase {
  public get name (): string {
    return 'cache-clear';
  }

  public get description (): string {
    return 'Clear all items in the cache';
  }

  protected onAction (): Promise<void> {
    return new Promise<void>(async (resolve) => {
      await this.serviceCache.clear();
      resolve();
    });
  }
}
