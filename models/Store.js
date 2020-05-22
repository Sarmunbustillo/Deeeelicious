const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: 'Please enter a store name.',
    },
    slug: String,
    description: {
      type: String,
      trim: true,
    },
    tags: [String],
    created: {
      type: Date,
      default: Date.now,
    },
    location: {
      type: {
        type: String,
        default: 'Point',
      },
      coordinates: [
        {
          type: Number,
          required: 'You must supply coordinates!',
        },
      ],
      address: {
        type: String,
        required: 'You must supply an address!',
      },
    },
    photo: String,
    author: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: 'You must suppply an Author',
    },
  },
  //so virtual fields appear also in the json
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
//define our indexes
storeSchema.index({
  name: 'text',
  description: 'text',
});

storeSchema.index({ location: '2dsphere' });

storeSchema.pre('save', async function (next) {
  if (!this.isModified('name')) {
    next(); //skip this
    return; //stop this function from running
  }
  this.slug = slug(this.name);

  //find another stores that have a slug sar, sar-1, sar-2
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });

  if (storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }

  next();
  //todo make more resiliant so slugs are unique
});

//check mangodb document for aggregate and its funcitons
storeSchema.statics.getTagsList = function () {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
};

//populate the store with the reviews
//the first 'reviews' is our Review Schema, but mangdb converts it to lowercase and adds a s at the end. a1
//the second one is the naming of the property in the object
storeSchema.statics.getTopStores = function () {
  return this.aggregate([
    //lookup Stores and populate their reviews
    {
      $lookup: {
        from: 'reviews',
        localField: '_id',
        foreignField: 'store',
        as: 'reviews',
      },
    },
    //filter for only items have 2 or more reviews
    //the .1 is the index in the array that is how it works in mangodb
    {
      $match: { 'reviews.1': { $exists: true } },
    },

    // add the average field
    // project add a field to the actual one, but one has to specify what other fields to bring from the document model
    {
      $project: {
        photo: '$$ROOT.photo',
        name: '$$ROOT.name',
        reviews: '$$ROOT.reviews',
        slug: '$$ROOT.slug',
        averageRating: { $avg: '$reviews.rating' },
      },
    },

    // sort by our field, highest reviews first
    {
      $sort: {
        averageRating: -1,
      },
    },

    // limit at most 10
    {
      $limit: 10,
    },
  ]);
};

//find reviews where the stores ._id property === reviews store property
storeSchema.virtual('reviews', {
  ref: 'Review', // what model to link?
  localField: '_id', // which field on the store?
  foreignField: 'store', // which field on the review ?
});

function autopopulate(next) {
  this.populate('reviews');
  next();
}
storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Store', storeSchema);
