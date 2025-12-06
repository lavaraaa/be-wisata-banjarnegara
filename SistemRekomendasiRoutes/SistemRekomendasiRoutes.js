const express = require('express');
const router = express.Router();

const CBF = require('../SistemRekomendasiControllers/ContentBasedFilteringController');
const CF = require('../SistemRekomendasiControllers/CollaborativeFilteringController');
const Hybrid = require('../SistemRekomendasiControllers/HybridController');
const CBFbyWisata = require('../SistemRekomendasiControllers/CBFbyWisataController');

router.get('/cbf/:userId', CBF.getCBF);
router.get('/cf/:userId', CF.getCF);
router.get('/hybrid/:userId', Hybrid.getHybrid);
router.get('/cbf/wisata/:wisataId', CBFbyWisata.getCBFbyWisata);

module.exports = router;
