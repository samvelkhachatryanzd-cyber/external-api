'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('applications', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      company_number: { type: Sequelize.STRING(20), allowNull: false },
      company_name: { type: Sequelize.STRING(200), allowNull: false },
      address_line_1: { type: Sequelize.STRING(200), allowNull: false },
      address_line_2: { type: Sequelize.STRING(200), allowNull: true },
      city: { type: Sequelize.STRING(100), allowNull: false },
      postcode: { type: Sequelize.STRING(20), allowNull: false },
      contact_name: { type: Sequelize.STRING(100), allowNull: false },
      contact_email: { type: Sequelize.STRING(255), allowNull: false },
      status: { type: Sequelize.ENUM('new', 'approved', 'rejected'), allowNull: false, defaultValue: 'new' },
      decision_note: { type: Sequelize.STRING(500), allowNull: true },
      decided_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('applications');
  },
};
