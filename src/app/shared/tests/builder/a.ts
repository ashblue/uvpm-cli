import { UnityPackageBuilder } from './unity-package-builder';
import { CommandBuilder } from './command-builder';

export class A {
  public static unityPackage (): UnityPackageBuilder {
    return new UnityPackageBuilder();
  }

  public static command (): CommandBuilder {
    return new CommandBuilder();
  }
}
