const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema(
    {
        Championat: {type: String},
        HomePerson: {type: String},
        GuestPerson: {type: String},
        Score: {
            Main: {type: String},
            More: {type: Array}
        },
        DateGame: {type: Date}
    },
    {
        timestamps: true
    }
);

schema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Games', schema);