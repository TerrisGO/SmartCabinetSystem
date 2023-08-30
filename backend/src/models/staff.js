export default (sequelize, DataTypes) => {
    const Staff = sequelize.define('staff', {
        staff_id: {
          type: DataTypes.INTEGER(100),
          field: 'staff_id',
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        staff_name: {
          type: DataTypes.STRING(255),
          field: 'staff_name'
        },
        staff_email: {
          type: DataTypes.STRING(100),
          field: 'staff_email'
        },
        staff_pass: {
          type: DataTypes.STRING(255),
          field: 'staff_pass'
        },
        staff_phone: {
          type: DataTypes.INTEGER(11),
          field: 'staff_phone'
        },
        staff_addr: {
          type: DataTypes.STRING(255),
          field: 'staff_addr',
          allowNull: true
        },
        duty_status: {
          type: DataTypes.ENUM('Online', 'Offline'),
          field: 'duty_status'
        }

      }, {
        freezeTableName: true, // Model tableName will be the same as the model name
        timestamps: false,
        underscored: true
      });
    
      Staff.associate = function(models) {

      }
    
      return Staff;
    }; 
    
    