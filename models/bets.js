const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema(
    {
        Championat: {type: String},
        Team: {type: String},
        PlayerOne: {type: String},
        PlayerTwo: {type: String},
        CurrentScore: {type: String},
        PartBet: {type: Number},
        Status: {type: String}
    },
    {
        timestamps: true
    }
);

schema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Bets', schema);