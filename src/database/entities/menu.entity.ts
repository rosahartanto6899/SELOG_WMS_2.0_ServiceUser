import { DataTypes, Optional, ModelDefined } from 'sequelize';
import { MenuAttributes } from '../attributes/';
import { sequelize } from '@/utils/database.util';

type MenuCreationAttributes = Optional<
  MenuAttributes,
  'id' | 'createdBy' | 'updatedBy' | 'deletedBy'
>;

const tableName = 'Menu';

const Menu: ModelDefined<MenuAttributes, MenuCreationAttributes> =
  sequelize.define(
    tableName,
    {
      id: {
        type: DataTypes.UUIDV4,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      parentId: {
        type: DataTypes.UUIDV4,
        allowNull: true,
      },
      level: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      menu: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      url: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      icon: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      isTab: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      menuCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      updatedBy: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deletedBy: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
    },
    {
      tableName,
      timestamps: true,
    }
  );

export { Menu };
