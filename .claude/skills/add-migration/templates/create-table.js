// TEMPLATE for a new-table migration. Copy to backend/migrations/YYYYMMDDHHMMSS-create-<table>.js and adapt.
// Style mirrors backend/migrations/20261112100000-create-applications.js. The columns below are an example
// (stored Companies House check results); replace them with the real ones.
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('company_checks', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      application_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'applications', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      outcome: { type: Sequelize.ENUM('found', 'not_found', 'failed'), allowNull: false },
      http_status: { type: Sequelize.INTEGER, allowNull: true },
      profile: { type: Sequelize.JSON, allowNull: true },
      officers: { type: Sequelize.JSON, allowNull: true },
      error_message: { type: Sequelize.STRING(500), allowNull: true },
      fetched_at: { type: Sequelize.DATE, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('company_checks', ['application_id', 'fetched_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('company_checks');
  },
};
