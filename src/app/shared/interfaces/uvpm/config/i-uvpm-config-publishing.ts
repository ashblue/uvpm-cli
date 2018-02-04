export interface IUvpmConfigPublishing {
  unityVersion: {
    min: string;
    max: string;
  };

  targetFolder: string;
  ignore: string[];
  tests: string[];
  examples: string[];
}
