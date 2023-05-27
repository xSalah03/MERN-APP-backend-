const { createCommentCtrl, getAllCommentsCtrl, deleteCommentCtrl, updateCommentCtrl } = require('../controllers/commentController');
const { verifyToken, verifyTokenAndAdmin } = require('../middlewares/verifyToken');
const validateObjectId = require('../middlewares/validateObjectId');
const router = require('express').Router();

router.route('/')
    .post(verifyToken, createCommentCtrl)
    .get(verifyTokenAndAdmin, getAllCommentsCtrl);

router.route('/:id')
    .delete(validateObjectId, verifyToken, deleteCommentCtrl)
    .put(validateObjectId, verifyToken, updateCommentCtrl);

module.exports = router;