interface IPayloadJwt {
  sub: string;
  iss: string;
  roleId?: string;
  role?: string;
  roles?: any[];
  name?: string;
  menus?: any[];
  email?: string;
  customerCode?: string | null;
  customerName?: string | null;
  warehouses?: { warehouseCode: string; warehouseName: string | null }[];
  type: string;
}

export { IPayloadJwt };
