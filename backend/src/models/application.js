module.exports = (sequelize, DataTypes) => {
  const Application = sequelize.define(
    'Application',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      companyNumber: { type: DataTypes.STRING(20), allowNull: false },
      companyName: { type: DataTypes.STRING(200), allowNull: false },
      addressLine1: { type: DataTypes.STRING(200), allowNull: false, field: 'address_line_1' },
      addressLine2: { type: DataTypes.STRING(200), allowNull: true, field: 'address_line_2' },
      city: { type: DataTypes.STRING(100), allowNull: false },
      postcode: { type: DataTypes.STRING(20), allowNull: false },
      contactName: { type: DataTypes.STRING(100), allowNull: false },
      contactEmail: { type: DataTypes.STRING(255), allowNull: false },
      status: { type: DataTypes.ENUM('new', 'approved', 'rejected'), allowNull: false, defaultValue: 'new' },
      decisionNote: { type: DataTypes.STRING(500), allowNull: true },
      decidedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'applications', underscored: true, updatedAt: false }
  );

  return Application;
};
