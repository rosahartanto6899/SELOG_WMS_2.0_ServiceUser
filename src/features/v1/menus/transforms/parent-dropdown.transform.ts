import { MenuAttributes } from '@/database/attributes';
import { BaseTransform } from '@/shared-libs/base';
import { DateHelper } from '@/shared-libs/helpers/date.helper';

export class ParentDropdownTransform extends BaseTransform {
  transform(menu: MenuAttributes): any {
    const parentMenu = menu.parent
      ? {
          id: menu.parent.id,
          menuName: menu.parent.menu,
          parentId: menu.parent.parentId,
          menuIcon: menu.parent.icon,
          menuLink: menu.parent.url,
          isTab: menu.parent.isTab ?? false,
          menuOrder: menu.parent.order,
          createdAt: menu.parent.createdAt
            ? DateHelper.formatDefault(menu.parent.createdAt)
            : '',
          createdBy: menu.parent.createdBy,
          updatedAt: menu.parent.updatedAt
            ? DateHelper.formatDefault(menu.parent.updatedAt)
            : '',
          updatedBy: menu.parent.updatedBy,
        }
      : null;

    const childrenMenu = menu.parentId
      ? null
      : menu.children
      ? menu.children.map((child) => ({
          id: child.id,
          menuName: child.menu,
          parentId: child.parentId,
          parent: {
            id: menu.id,
            menuName: menu.menu,
            parentId: menu.parentId,
            isTab: menu.isTab ?? false,
            menuOrder: menu.order,
            menuIcon: menu.icon,
            menuLink: menu.url,
            createdAt: menu.createdAt
              ? DateHelper.formatDefault(menu.createdAt)
              : '',
            createdBy: menu.createdBy,
            updatedAt: menu.updatedAt
              ? DateHelper.formatDefault(menu.updatedAt)
              : '',
            updatedBy: menu.updatedBy,
          },
          menuOrder: child.order,
          menuIcon: child.icon,
          menuLink: child.url,
          createdAt: child.createdAt
            ? DateHelper.formatDefault(child.createdAt)
            : '',
          createdBy: child.createdBy,
          updatedAt: child.updatedAt
            ? DateHelper.formatDefault(child.updatedAt)
            : '',
          updatedBy: child.updatedBy,
        }))
      : null;

    return {
      id: menu.id,
      menuName: menu.menu,
      parentId: menu.parentId,
      menuIcon: menu.icon,
      menuLink: menu.url,
      isTab: menu.isTab ?? false,
      menuOrder: menu.order,
      parent: parentMenu,
      children: childrenMenu,
      createdAt: menu.createdAt ? DateHelper.formatDefault(menu.createdAt) : '',
      createdBy: menu.createdBy,
      updatedAt: menu.updatedAt ? DateHelper.formatDefault(menu.updatedAt) : '',
      updatedBy: menu.updatedBy,
    };
  }
}
