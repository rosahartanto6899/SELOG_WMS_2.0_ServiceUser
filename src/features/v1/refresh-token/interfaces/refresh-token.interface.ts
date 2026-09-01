interface IPayloadJwt {
  sub: string;
  iss: string;
  roleId?: number;
  role?: string;
  roles?: string;
  email?: string;
  type: string;
}

export { IPayloadJwt };
