export default (sequelize, DataTypes) => {
    const BoxServicing = sequelize.define('box_servicing', {
        service_id: {
          type: DataTypes.INTEGER(100),
          field: 'service_id',
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        localbox_fkid: {
          type: DataTypes.INTEGER(100),
          field: 'localbox_fkid',
          allowNull: false
        },
        start_datetime: {
          type: DataTypes.DATE,
          field: 'start_datetime',
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        expire_datetime: {
          type: DataTypes.DATE,
          field: 'expire_datetime',
          allowNull: false
        },
        targetbox_fkid: {
            type: DataTypes.INTEGER(100),
            field: 'targetbox_fkid',
            allowNull: true
        },
        usr_email: {
            type: DataTypes.STRING(255),
            field: 'usr_email',
            allowNull: false
        },
        usr_phone: {
            type: DataTypes.INTEGER(11),
            field: 'usr_phone',
            allowNull: false
        },
        paid_amount: {
            type: DataTypes.INTEGER(11),
            field: 'paid_amount',
            allowNull: false
        },
        service_type: {
            type: DataTypes.ENUM('L_S', 'T_S'),
            field: 'service_type',
            allowNull: false
        },
        unlock_method: {
            type: DataTypes.ENUM('FnQR', 'QR'),
            field: 'unlock_method',
            defaultValue: "QR",
            allowNull: false
        },
        transfer_handling: {
            type: DataTypes.BOOLEAN,
            field: 'transfer_handling',
            defaultValue: "0",
            allowNull: false
        },
        transfer_complete: {
            type: DataTypes.BOOLEAN,
            field: 'transfer_complete',
            defaultValue: "0",
            allowNull: false
        },
        store_hours: {
            type: DataTypes.INTEGER(11),
            field: 'store_hours',
            allowNull: false
        },
        store_days: {
            type: DataTypes.INTEGER(11),
            field: 'store_days',
            allowNull: false
        },
        service_terminated: {
            type: DataTypes.BOOLEAN,
            field: 'service_terminated',
            defaultValue: "0",
            allowNull: false
        }
      }, {
        freezeTableName: true, // Model tableName will be the same as the model name
        timestamps: false,
        underscored: true
      });
    
      BoxServicing.associate = function(models) {
        BoxServicing.belongsTo(models.boxes, {
            foreignKey: 'localbox_fkid',
            sourceKey: 'box_id'
        });
        
        BoxServicing.belongsTo(models.boxes, {
            foreignKey: 'targetbox_fkid',
            sourceKey: 'box_id'
        });
        /*
        BoxServicing.belongsToMany(models.transfer_allocation, {
            through: 'service_id',
            as: 'box_servicing_fk'
          });*/
        }
    
      return BoxServicing;
    }; 
    
    