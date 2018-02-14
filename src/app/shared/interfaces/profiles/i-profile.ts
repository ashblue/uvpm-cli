import { IPouchModel } from '../pouch-db/i-pouch-model';

export interface IProfile extends IPouchModel {
  token: string|null;
  email: string|null;
  server: string|null;
}
