// TEMPLATE for adding columns to an existing table. Copy to backend/migrations/YYYYMMDDHHMMSS-add-<column>-to-<table>.js.
// New columns on `applications` must be nullable or have a default: existing rows and scripts/seed.js must keep working.
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('applications', 'company_check_status', {
      type: Sequelize.ENUM('pending', 'checked', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    });
    await queryInterface.addColumn('applications', 'checked_at', { type: Sequelize.DATE, allowNull: true });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('applications', 'checked_at');
    await queryInterface.removeColumn('applications', 'company_check_status');
  },
};
