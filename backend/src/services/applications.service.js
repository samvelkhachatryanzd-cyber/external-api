const { Application } = require('../models');
const { NotFoundError, ConflictError } = require('../utils/errors');

async function listApplications(filter, { page, limit }) {
  const { rows, count } = await Application.findAndCountAll({
    where: filter,
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });
  return { items: rows, total: count, page, limit };
}

async function getApplication(id) {
  const application = await Application.findByPk(id);
  if (!application) throw new NotFoundError('Application not found');
  return application;
}

async function createApplication(data) {
  const application = await Application.create(data);
  return getApplication(application.id);
}

async function decide(id, status, note) {
  const application = await getApplication(id);
  if (application.status !== 'new') throw new ConflictError(`Application is already ${application.status}`);
  await application.update({ status, decisionNote: note, decidedAt: new Date() });
  return getApplication(id);
}

function approve(id) {
  return decide(id, 'approved', null);
}

function reject(id, note) {
  return decide(id, 'rejected', note);
}

module.exports = { listApplications, getApplication, createApplication, approve, reject };
