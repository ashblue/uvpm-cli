declare module 'get-installed-path' {
  export function getInstalledPath (package: string, opts?: any): Promise<string>;
  export function getInstalledPathSync (package: string, opts?: any): string;
}
