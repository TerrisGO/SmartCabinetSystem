
export default (sequelize, DataTypes) => {
    const TransferAllocation = sequelize.define('transfer_allocation', {
        acquire_id: {
          type: DataTypes.INTEGER(100),
          field: 'acquire_id',
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        staff_fkid: {
          type: DataTypes.INTEGER(100),
          field: 'staff_fkid',
          allowNull: false
        },
        box_servicing_fk: {
          type: DataTypes.INTEGER(100),
          field: 'box_servicing_fk',
          allowNull: false
        },
        transfer_status: {
          type: DataTypes.ENUM('Success', 'Cancelled', 'Pending'),
          field: 'transfer_status',
          allowNull: false,
          defaultValue: 'Pending'
        },
        acquire_time: {
          type: DataTypes.DATE,
          field: 'acquire_time',
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        handling_time: {
          type: DataTypes.DATE,
          field: 'handling_time',
          allowNull: true
        },
        complete_time: {
         type: DataTypes.DATE,
         field: 'complete_time',
         allowNull: true
        },
        cancelled_time: {
          type: DataTypes.DATE,
          field: 'cancelled_time',
          allowNull: true
        }
      }, {
        freezeTableName: true, // Model tableName will be the same as the model name
        timestamps: false,
        underscored: true
      });
    
      TransferAllocation.associate = function(models) {
       TransferAllocation.belongsTo(models.staff, {
          foreignKey: 'staff_fkid',
          sourceKey: 'staff_id'
        });
        TransferAllocation.belongsTo(models.box_servicing, {
          foreignKey: 'box_servicing_fk',
          sourceKey: 'service_id'
        });
      }
    
      return TransferAllocation;
    }; 
    
    