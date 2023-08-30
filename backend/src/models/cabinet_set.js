import db from '../models';
export default (sequelize, DataTypes) => {
    const Cabinet_set = sequelize.define('cabinet_set', {
        cabinet_id: {
          type: DataTypes.INTEGER(50),
          field: 'cabinet_id',
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        location_name: {
          type: DataTypes.STRING(255),
          field: 'location_name'
        },
        gpslocation: {
          type: DataTypes.STRING(255),
          field: 'gpslocation'
        },
        totalboxs: {
          type: DataTypes.INTEGER(10),
          field: 'totalboxs',
          defaultValue: "0",
          allowNull: false
        },
        cabinet_addr: {
            type: DataTypes.STRING(255),
            field: 'cabinet_addr'
        },
        cabinet_pass: {
            type: DataTypes.STRING(255),
            field: 'cabinet_pass'
        },
        hardware_detail: {
            type: DataTypes.STRING(255),
            field: 'hardware_detail'
        }

      }, {
        freezeTableName: true, // Model tableName will be the same as the model name
        timestamps: false,
        underscored: true
      });
    
      Cabinet_set.associate = function(models) {
        Cabinet_set.hasMany(models.boxes, {
          targetKey: 'cabinet_id',
          foreignKey: 'cabinet_fk'
        });
      }
    
      return Cabinet_set;
    }; 