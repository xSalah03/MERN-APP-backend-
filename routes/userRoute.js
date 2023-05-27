const router = require('express').Router();
const { getAllUsersCtrl, updateUserCtrl, getUsersCountCtrl, profilePhotoUploadCtrl, deleteUserCtrl, getUserCtrlById } = require('../controllers/userController');
const photoUpload = require('../middlewares/photoUpload');
const validateObjectId = require('../middlewares/validateObjectId');
const { verifyTokenAndAdmin, verifyTokenAndOnlyUser, verifyToken, verifyTokenAndAuthorization } = require('../middlewares/verifyToken');

router.route('/profile').get(verifyTokenAndAdmin, getAllUsersCtrl);

router.route('/profile/:id')
    .get(validateObjectId, getUserCtrlById)
    .put(validateObjectId, verifyTokenAndOnlyUser, updateUserCtrl)
    .delete(validateObjectId, verifyTokenAndAuthorization, deleteUserCtrl);

router.route('/profile/profile-photo-upload')
    .post(verifyToken, photoUpload.single('image'), profilePhotoUploadCtrl);

router.route('/count').get(verifyTokenAndAdmin, getUsersCountCtrl);

module.exports = router;