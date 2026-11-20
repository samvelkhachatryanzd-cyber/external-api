// TEMPLATE for the model matching templates/create-table.js. Copy to backend/src/models/<name>.js (camelCase file name
// like application.js; models/index.js loads every file in the folder automatically).
// Style mirrors backend/src/models/application.js: camelCase attributes, snake_case columns via `underscored`,
// explicit `field:` only where the name is not a plain camelCase-to-snake_case conversion (address_line_1).
module.exports = (sequelize, DataTypes) => {
  const CompanyCheck = sequelize.define(
    'CompanyCheck',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      applicationId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      outcome: { type: DataTypes.ENUM('found', 'not_found', 'failed'), allowNull: false },
      httpStatus: { type: DataTypes.INTEGER, allowNull: true },
      profile: { type: DataTypes.JSON, allowNull: true },
      officers: { type: DataTypes.JSON, allowNull: true },
      errorMessage: { type: DataTypes.STRING(500), allowNull: true },
      fetchedAt: { type: DataTypes.DATE, allowNull: false },
    },
    { tableName: 'company_checks', underscored: true, updatedAt: false }
  );

  CompanyCheck.associate = (db) => {
    CompanyCheck.belongsTo(db.Application, { foreignKey: 'applicationId' });
    db.Application.hasMany(CompanyCheck, { foreignKey: 'applicationId' });
  };

  return CompanyCheck;
};
