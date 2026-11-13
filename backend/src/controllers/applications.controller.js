const service = require('../services/applications.service');
const companyCheck = require('../services/companyCheck.service');
const validate = require('../validators/applications.validator');

async function list(req, res) {
  res.json(await service.listApplications(validate.listQuery(req.query)));
}

async function create(req, res) {
  res.status(201).json(await service.createApplication(validate.createBody(req.body)));
}

async function get(req, res) {
  res.json(await service.getApplication(validate.id(req.params.id)));
}

async function compare(req, res) {
  res.json(await companyCheck.compareApplication(validate.id(req.params.id)));
}

async function approve(req, res) {
  res.json(await service.approve(validate.id(req.params.id)));
}

async function reject(req, res) {
  const { note } = validate.rejectBody(req.body);
  res.json(await service.reject(validate.id(req.params.id), note));
}

module.exports = { list, create, get, compare, approve, reject };
