function clean(value) {
  if (value === undefined || value === null) return null;
  const text = String(value);
  return text === '' ? null : text;
}

function registerAddressLine1(address) {
  const parts = [clean(address.premises), clean(address.address_line_1)].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

function toCompany(profile, officers) {
  const address = profile.registered_office_address || {};

  return {
    number: clean(profile.company_number),
    name: clean(profile.company_name),
    status: clean(profile.company_status),
    type: clean(profile.type),
    dateOfCreation: clean(profile.date_of_creation),
    registeredOffice: {
      addressLine1: registerAddressLine1(address),
      addressLine2: clean(address.address_line_2),
      city: clean(address.locality),
      region: clean(address.region),
      postcode: clean(address.postal_code),
      country: clean(address.country),
    },
    directors: officers
      .filter((officer) => /director$/.test(officer.officer_role || '') && !officer.resigned_on)
      .map((officer) => ({
        name: clean(officer.name),
        role: clean(officer.officer_role),
        appointedOn: clean(officer.appointed_on),
      })),
  };
}

function findMismatches(application, company) {
  const pairs = [
    ['companyNumber', application.companyNumber, company.number],
    ['companyName', application.companyName, company.name],
    ['addressLine1', application.addressLine1, company.registeredOffice.addressLine1],
    ['addressLine2', application.addressLine2, company.registeredOffice.addressLine2],
    ['city', application.city, company.registeredOffice.city],
    ['postcode', application.postcode, company.registeredOffice.postcode],
  ];

  const mismatches = pairs
    .map(([field, applicant, register]) => ({ field, applicant: clean(applicant), register: clean(register) }))
    .filter((pair) => pair.applicant !== pair.register);

  if (company.status !== 'active') mismatches.push({ field: 'status', applicant: null, register: company.status });

  return mismatches;
}

module.exports = { toCompany, findMismatches };
