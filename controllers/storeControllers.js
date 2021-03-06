const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer');
const jimp = require('jimp');
const uui = require('uuid');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: "That filetype isn't allowed!" }, false);
    }
  },
};

exports.homePage = (req, res) => {
  console.log(req.name);
  req.flash('');
  res.render('index');
};

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store' });
};

exports.createStore = async (req, res) => {
  req.body.author = req.user._id;
  const store = await new Store(req.body).save();
  await store.save();
  req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);
  res.redirect(`/store/${store.slug}`);
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  // check if there is no new file to resize
  if (!req.file) {
    next(); // skip to the next middleware
    return;
  }
  const extensions = req.file.mimetype.split('/')[1];
  req.body.photo = `${uui.v4()}.${extensions}`;
  //now we resize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  // once we have written the photo to our filesystem, keep going
  next();
};

//with pagination
exports.getStores = async (req, res) => {
  const page = req.params.page || 1;
  const limit = 6;
  const skip = page * limit - limit;

  // 1. Query the database for a list of all stores
  const storesPromise = Store.find().skip(skip).limit(limit).sort({ created: 'desc' });
  //returns how many items there are in the document
  const countPromise = Store.count();
  //wait until both are ready
  const [stores, count] = await Promise.all([storesPromise, countPromise]);
  //how many pages there are
  const pages = Math.ceil(count / limit);
  //if the try to go to a page that does not exists in the url
  if (!stores.length && skip) {
    req.flash('info', `Hey! you asked for page ${page}. But that doesn't exists. So I put you on page ${pages}`);
    res.redirect(`/stores/page/${pages}`);
    return;
  }

  res.render('stores', { title: 'Stores', stores, page, pages, count });
};

//before they can edit the store confirm that they are the actual owner
const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error('You must own a store in order to edit it!');
  }
};
exports.editStore = async (req, res) => {
  // find store given ID
  const store = await Store.findOne({ _id: req.params.id });

  // comfirm they are the owner of the store
  confirmOwner(store, req.user);
  // render out the edit form so the user can update store
  res.render('editStore', { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
  //set the location data to be a point. point helps to indicate what is nearby in the map
  req.body.location.type = 'Point';
  //find and update the store
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return the new store instead of the old one
    runValidators: true,
  }).exec();

  req.flash(
    'success',
    ` Successfully updated <strong> ${store.name} </strong>. <a href='/stores/${store.slug}'> View Store<a/>`
  );
  res.redirect(`/stores/${store._id}/edit`);
  // redirect them to the store and tel them it worked
};

exports.getStoreBySlug = async (req, res, next) => {
  //.populate will find and populate by the related/associated id
  const store = await Store.findOne({ slug: req.params.slug }).populate('author reviews');
  if (!store) return next(); // the slug does not exists
  res.render('store', { store, title: store.name });
};

exports.getStoreByTag = async (req, res) => {
  const tag = req.params.tag;
  const tagQuery = tag || { $exists: true, $ne: [] };
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagQuery });
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
  res.render('tag', { tags, title: 'Tags', tag, stores });
};

exports.searchStores = async (req, res) => {
  const stores = await Store
    //first find stores that match
    .find(
      {
        $text: {
          $search: req.query.q,
        },
      },
      {
        score: { $meta: 'textScore' },
      }
    )
    //sort them by score metadata
    .sort({
      score: { $meta: 'textScore' },
    })
    //limit to only 5
    .limit(5);
  res.json(stores);
};

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates,
        },
        $maxDistance: 20000, //10km
      },
    },
  };

  //slect selects what fields to pull from the data base
  const stores = await Store.find(q).select('slug name description location photo').limit(10);
  res.json(stores);
};

exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' });
};

exports.heartStore = async (req, res) => {
  const hearts = req.user.hearts.map((obj) => obj.toString());
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      [operator]: { hearts: req.params.id },
    },
    { new: true }
  );
  res.json(user);
};

//get stores by hearts
exports.getHearts = async (req, res) => {
  //find in stores the stores that the id (id and hearts are the same value) is in the hearts array
  const stores = await Store.find({
    _id: { $in: req.user.hearts },
  });

  res.render('stores', { title: 'Liked Stores', stores });
};

exports.getTopStores = async (req, res) => {
  const stores = await Store.getTopStores();
  res.render('topStores', { stores, title: '\u2605 Top Stores!' });
};
