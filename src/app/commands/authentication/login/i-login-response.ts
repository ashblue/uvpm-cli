export interface ILoginResponse {
  token: string;
  user: {
    createdAt: string;
    name: string,
    email: string;
    id: string;
  };
}
