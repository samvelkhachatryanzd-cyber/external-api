require('dotenv').config({ quiet: true });
const path = require('path');
const fs = require('fs');
const { sequelize } = require('../src/models');

const FILE = path.join(__dirname, 'applications.json');

async function main() {
  const [[{ n }]] = await sequelize.query('SELECT COUNT(*) AS n FROM applications');
  if (Number(n) > 0) {
    console.error(`applications already has ${n} rows. Run "npm run db:reset" to start over.`);
    process.exit(1);
  }

  const applications = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const rows = applications.map((a, i) => ({
    id: i + 1,
    company_number: a.companyNumber,
    company_name: a.companyName,
    address_line_1: a.addressLine1,
    address_line_2: a.addressLine2,
    city: a.city,
    postcode: a.postcode,
    contact_name: a.contactName,
    contact_email: a.contactEmail,
    status: a.status,
    decision_note: a.decisionNote,
    decided_at: a.decidedAt ? new Date(a.decidedAt) : null,
    created_at: new Date(a.createdAt),
  }));
  await sequelize.getQueryInterface().bulkInsert('applications', rows);

  const count = (status) => rows.filter((row) => row.status === status).length;
  console.log(
    `inserted ${rows.length} applications (${count('new')} new, ${count('approved')} approved, ${count('rejected')} rejected)`
  );
  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
