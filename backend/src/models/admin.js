export default (sequelize, DataTypes) => {
  const Admin = sequelize.define(
    'Admin',
    {
      firstname: DataTypes.STRING,
      lastname: DataTypes.STRING,
      username: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      role: DataTypes.STRING,
    },
    {}
  );

  Admin.associate = function(models) {
    // associations go here
  };

  return Admin;
};
