import { MenuAttributes } from '@/database/attributes';
import { BaseTransform } from '@/shared-libs/base';
import { DateHelper } from '@/shared-libs/helpers/date.helper';

export class ByIdTransform extends BaseTransform {
  transform(menu: MenuAttributes): any {
    const parentMenu = menu.parent
      ? {
          id: menu.parent.id,
          menuName: menu.parent.menu,
          parentId: menu.parent.parentId,
          menuIcon: menu.parent.icon,
          isTab: menu.parent.isTab,
          menuOrder: menu.parent.order,
          menuLink: menu.parent.url,
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

    const childrenMenu = menu.children
      ? menu.children.map((child) => ({
          id: child.id,
          menuName: child.menu,
          parentId: child.parentId,
          parent: {
            id: menu.id,
            menuName: menu.menu,
            parentId: menu.parentId,
            menuIcon: menu.icon,
            menuLink: menu.url,
            isTab: menu.isTab,
            menuOrder: menu.order,
            createdAt: menu.createdAt
              ? DateHelper.formatDefault(menu.createdAt)
              : '',
            createdBy: menu.createdBy,
            updatedAt: menu.updatedAt
              ? DateHelper.formatDefault(menu.updatedAt)
              : '',
            updatedBy: menu.updatedBy,
          },
          children: [],
          menuIcon: child.icon,
          menuLink: child.url,
          isTab: child.isTab,
          menuOrder: child.order,
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
      isTab: menu.isTab,
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
