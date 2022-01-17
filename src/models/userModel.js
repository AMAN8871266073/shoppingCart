const mongoose = require("mongoose")
const userSchema = new mongoose.Schema({
  fname: {
    type: String,
    required: true,
    trim: true
  },
  lname: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function (email) {
        return /^([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})$/.test(email)
      }, message: 'invalid email entered', isasync: false
    }
  },
  profileImage: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    trim: true,
    required: true,
    unique: true,
    validate: {
      validator: function (phone) {
        return /^[6-9]\d{9}$/.test(phone)
      }, message: 'invalid mobile number entered'
    }
  },
  password: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    shipping: {
      street: {
        type: String,
        required: true,
        trim: true
      },
      city: {
        type: String,
        required: true,
        trim: true
      },
      pincode: {
        type: Number,
        required: true,
        trim: true
      }
    },
    billing: {
      street: {
        type: String,
        required: true,
        trim: true
      },
      city: {
        type: String,
        required: true,
        trim: true
      },
      pincode: {
        type: Number,
        required: true,
        trim: true
      }
    }
  },
}, { timestamps: true })
module.exports = mongoose.model('cartUser', userSchema)