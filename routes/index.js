const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeControllers');
const userController = require('../controllers/userControllers');
const authController = require('../controllers/authControllers');
const { catchErrors } = require('../handlers/errorHandlers');

//create a store  (making sure the are logged in)
router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/add', authController.isLoggedIn, storeController.addStore);

//save created a store to db
router.post(
  '/add',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.createStore)
);
//update store in db
router.post(
  '/add/:id',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.updateStore)
);

//editStore
router.get(`/stores/:id/edit`, catchErrors(storeController.editStore));
router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));

//tags
router.get('/tags', catchErrors(storeController.getStoreByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoreByTag));

// forms to login and register
router.get('/login', userController.loginForm);
router.post('/login', authController.login);
router.get('/register', userController.registerForm);

// 1. validate the registration data
// 2. register the user
// 3. we need to log the in
router.post('/register', userController.validateRegister, userController.register, authController.login);

//logout
router.get('/logout', authController.logout);

// account
router.get('/account', authController.isLoggedIn, userController.account);
router.post('/account', catchErrors(userController.updateAccount));

//forgot password/email
router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:token', catchErrors(authController.reset));
router.post('/account/reset/:token', authController.confirmedPasswords, catchErrors(authController.update));

router.get('/map', storeController.mapPage);

//API

router.get('/api/search', catchErrors(storeController.searchStores));
router.get('/api/stores/near', catchErrors(storeController.mapStores));
router.post('/api/stores/:id/heart', catchErrors(storeController.heartStore));

module.exports = router;
