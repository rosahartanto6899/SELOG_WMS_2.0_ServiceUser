export interface MenuAttributes {
  id?: string;
  parentId?: string;
  parent?: MenuAttributes | null;
  children?: MenuAttributes[] | null;
  level: number;
  menu: string;
  url: string;
  icon?: string;
  order: number;
  isTab?: boolean;
  menuCode?: string;

  createdAt?: Date;
  createdBy?: string;
  updatedAt?: Date;
  updatedBy?: string;
  deletedAt?: Date;
  deletedBy?: string;
}
