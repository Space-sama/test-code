const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcrypt = require('bcrypt');


const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'E-mail est obligatoire..'],
    unique: true,
    lowercase: true,
    validate: [isEmail, 'Veuillez svp entrez un e-mail valide..'],
  },
  password: {
    type: String,
    required: [true, 'mot de passe est obligatoire..'],
    minlength: [6, 'Mot de passe doit avoir 6 lettres au minimum..'],
  },
  status: {
    type: String,
    required: true,
    default: 'active'
  }
});

// fire a function after doc saved to db
userSchema.post('save', function (doc, next) {
    // console.log('new user was created & saved', doc);
    next();
});
  
// fire a function before doc saved to db
userSchema.pre('save', async function (next) {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// static method to login user
userSchema.statics.login = async function(email, password) {
  const user = await this.findOne({ email });
  if (user) {
    const auth = await bcrypt.compare(password, user.password);
    if (auth) {
      return user;
    }
    throw Error('Mot de passe incorrect');
  }
  throw Error('Email incorrect');
};

const User = mongoose.model('user', userSchema);

module.exports = User;