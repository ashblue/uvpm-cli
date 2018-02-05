export interface ICmdOption {
  flags: string;
  description?: string;
  defaultValue?: any;
  fn?: ((arg1: any, arg2: any) => void) | RegExp;
}
