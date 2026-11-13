const { getApplication } = require('./applications.service');
const companiesHouse = require('./companiesHouse.client');
const { toCompany, findMismatches } = require('./companyComparison');

async function compareApplication(id) {
  const application = await getApplication(id);

  const profile = await companiesHouse.getCompanyProfile(application.companyNumber);
  const officers = await companiesHouse.getOfficers(application.companyNumber);

  const company = toCompany(profile, officers);
  return { company, mismatches: findMismatches(application, company) };
}

module.exports = { compareApplication };
