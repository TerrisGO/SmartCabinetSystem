import db from '../models';
export default (sequelize, DataTypes) => {
    const Boxes = sequelize.define('boxes', {
        box_id: {
          type: DataTypes.INTEGER(100),
          field: 'box_id',
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        cabinet_fk: {
          type: DataTypes.INTEGER(50),
          field: 'cabinet_fk'
        },
        available_status: {
          type: DataTypes.ENUM('R','A','E'),
          defaultValue: "E",
          field: 'available_status'
        },
        customerpass_qr: {
          type: DataTypes.STRING(255),
          field: 'customerpass_qr'
        },
        staffpass_qr: {
            type: DataTypes.STRING(255),
            field: 'staffpass_qr'
        },
        servo_pindetail: {
            type: DataTypes.STRING(255),
            field: 'servo_pindetail',
            allowNull: true
        },
        self_reserving: {
          type: DataTypes.BOOLEAN,
          field: 'self_reserving',
          defaultValue: "0",
          allowNull: false
        },
        reserved_by_otherBox: {
          type: DataTypes.BOOLEAN,
          field: 'reserved_by_otherBox',
          defaultValue: "0",
          allowNull: false
        },
        facereg_Filename: {
          type: DataTypes.STRING(255),
          field: 'facereg_Filename',
          allowNull: true
        },
        reserved_expire_datetime: {
          type: DataTypes.DATE,
          field: 'reserved_expire_datetime',
          allowNull: true
        }
        /*reservedbyotherBoxFK: {
          type: DataTypes.INTEGER(100),
          field: 'reservedbyotherBoxFK',
          allowNull: true
        }*/
      }, {
        freezeTableName: true, // Model tableName will be the same as the model name
        timestamps: false,
        underscored: true
      });
    
      Boxes.associate = function(models) {
        Boxes.belongsTo(models.cabinet_set, {
          sourceKey: 'cabinet_id',
          foreignKey:'cabinet_fk'
        });
       
        Boxes.hasMany(Boxes, {
          targetKey: 'box_id',
          foreignKey:'reservedbyotherBoxFK',
          allowNull: true
        });
      }
    
      return Boxes;
    }; 
    