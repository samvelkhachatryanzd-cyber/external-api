const { Router } = require('express');
const applications = require('../controllers/applications.controller');

const router = Router();

router.get('/applications', applications.list);
router.post('/applications', applications.create);
router.get('/applications/:id', applications.get);
router.post('/applications/:id/approve', applications.approve);
router.post('/applications/:id/reject', applications.reject);

module.exports = router;
