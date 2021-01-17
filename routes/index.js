const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('main');
});
router.get('/bot', (req, res) => {
    res.render('bot');
});
router.get('/statistics', (req, res) => {
    res.render('statistics');
});

module.exports = router;
