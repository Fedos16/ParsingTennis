const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema(
    {
        Name: {type: String},
        NumberGame: {type: Number},
        A9x2: {
            Number: {type: Number},
            TrueNumber: {type: Number},
            Percent: {type: Number}
        }
    },
    {
        timestamps: true
    }
);

schema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Championats', schema);