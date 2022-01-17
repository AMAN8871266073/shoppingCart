const userModel = require('../models/userModel')
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken")
const saltRounds = 10;
///////////////////AWS//////////////////////////////////////////////
const aws = require("aws-sdk");

aws.config.update({
    accessKeyId: "AKIAY3L35MCRRMC6253G",  // id
    secretAccessKey: "88NOFLHQrap/1G2LqUy9YkFbFRe/GNERsCyKvTZA",  // like your secret password
    region: "ap-south-1" // Mumbai region
});


// this function uploads file to AWS and gives back the url for the file
let uploadFile = async (file) => {
    return new Promise(function (resolve, reject) { // exactly 

        // Create S3 service object
        let s3 = new aws.S3({ apiVersion: "2006-03-01" });
        var uploadParams = {
            ACL: "public-read", // this file is publically readable
            Bucket: "classroom-training-bucket", // HERE
            Key: "user/" + file.originalname, // HERE    "pk_newFolder/harry-potter.png" pk_newFolder/harry-potter.png
            Body: file.buffer,
        };

        // Callback - function provided as the second parameter ( most oftenly)
        s3.upload(uploadParams, function (err, data) {
            if (err) {
                return reject({ "error": err });
            }
            console.log(data)
            console.log(`File uploaded successfully. ${data.Location}`);
            return resolve(data.Location); //HERE 
        });
    });
};
////////////////////////////validating function////////////////////////////////////
const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}
const isValidNumber = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    return true;
}
const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}
const isValidObject = function (value) {
    return Object.keys(value).length > 0
}
const isValidPassword = function (password) {
    if (password.trim().length < 8 || password.trim().length > 15) return false
    return true;
}
///////////////////////////Register Handler///////////////////////////
const registerUser = async function (req, res) {
    try {
        //////////////encryptedPassword///////////////////////////////
        const password = req.body.password;
        const salt = bcrypt.genSaltSync(saltRounds);
        const hash = bcrypt.hashSync(password, salt);
        ///////////////////////////Aws///////////////////////////////////////
        const file = req.files
        if (file && file.length > 0) {
            //upload to s3 and return true..incase of error in uploading this will goto catch block( as rejected promise)
            var uploadedFileURL = await uploadFile(file[0]); // expect this function to take file as input and give url of uploaded file as output 
            // return uploadedFileURL;
        }
        else {
            res.status(400).send({ status: false, msg: "No file to write" });
        }
        //////////////////////////////////////////////////////////
        let userData = req.body
        const addStr = userData.address
        const addObj = JSON.parse(addStr)
        let data = {
            fname: userData.fname,
            lname: userData.lname,
            password: hash,
            phone: userData.phone,
            email: userData.email,
            profileImage: uploadedFileURL,
            address: addObj
        }
        /////////////////////////////checks////////////////////////////////
        if (!isValidRequestBody(userData)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide blog details' })
            return
        }
        if (!isValid(data.fname)) {
            res.status(400).send({ status: false, message: 'first name is required' })
            return
        }
        if (!isValid(data.lname)) {
            res.status(400).send({ status: false, message: 'last name  is required' })
            return
        }
        if (!isValid(data.email)) {
            res.status(400).send({ status: false, message: 'email is required' })
            return
        }
        if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.email))) {
            res.status(400).send({ status: false, message: `Email should be a valid email address` })
            return
        }

        if (!isValid(data.phone)) {
            res.status(400).send({ status: false, message: 'phone num is required' })
            return
        }
        if (!(/^[6-9]{1}[0-9]{9}$/.test(data.phone))) {
            res.status(400).send({ status: false, message: `phone should be a valid mobile number` })
            return
        }
        if (!isValid(userData.password)) {
            res.status(400).send({ status: false, message: 'password is required' })
            return
        }
        if (!isValidPassword(userData.password)) {
            res.status(400).send({ status: false, message: 'invalid password length' })
            return
        }
        if (!isValid(file)) {
            res.status(400).send({ status: false, message: 'file is required' })
            return
        }
        if (!isValidObject(addObj)) {
            res.status(400).send({ status: false, message: 'address is required' })
            return
        }
        if (!isValidObject(addObj.shipping)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide blog details' })
            return
        }
        if (!isValid(addObj.shipping.street)) {
            res.status(400).send({ status: false, message: 'street is required' })
            return
        }
        if (!isValid(addObj.shipping.city)) {
            res.status(400).send({ status: false, message: 'street is required' })
            return
        }
        if (!isValidNumber(addObj.shipping.pincode)) {
            res.status(400).send({ status: false, message: 'street is required' })
            return
        }
        if (!(/^[1-9][0-9]{5}$/.test(addObj.shipping.pincode))) {
            res.status(400).send({ status: false, message: `pincode should be  valid ` })
            return
        }
        if (!isValidObject(addObj.billing)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide blog details' })
            return
        }
        if (!isValid(addObj.billing.street)) {
            res.status(400).send({ status: false, message: 'street is required' })
            return
        }
        if (!isValid(addObj.billing.city)) {
            res.status(400).send({ status: false, message: 'street is required' })
            return
        }
        if (!isValidNumber(addObj.billing.pincode)) {
            res.status(400).send({ status: false, message: 'street is required' })
            return
        }
        if (!(/^[1-9][0-9]{5}$/.test(addObj.billing.pincode))) {
            res.status(400).send({ status: false, message: `pincode should be  valid ` })
            return
        }
        /////////////////////////create/////////////////////////////
        let checkData = await userModel.findOne({ $or: [{ email: data.email }, { phone: data.phone }] })
        if (checkData) {
            return res.status(200).send({ status: true, 'msg': "document already exist with given email or phone" })
        }
        let savedUser = await userModel.create(data)
        return res.status(201).send({ status: true, 'data': savedUser })
    } catch (err) {
        res.status(500).send({ status: false, 'sg': err })
    }
}
///////////////////////Login Handler/////////////////////////////////////
const login = async function (req, res) {
    try {
        const user = req.body
        const email = user.email
        const password = user.password
        if (!isValidRequestBody(user)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide blog details' })
            return
        }
        if (!isValid(email)) {
            res.status(400).send({ status: false, message: 'email id required' })
            return
        }
        if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) {
            res.status(400).send({ status: false, message: `Email should be a valid email address` })
            return
        }
        if (!isValid(password)) {
            res.status(400).send({ status: false, message: 'password is required' })
            return
        }
        if (!isValidPassword(password)) {
            res.status(400).send({ status: false, message: 'invalid password length' })
            return
        }
        let checkUser = await userModel.findOne({ email: email })
        if (!checkUser) {
            return res.status(404).send({ status: false, 'msg': 'document doesnot exist with given credentials' })
        }
        const match = await bcrypt.compare(password, checkUser.password);
        if (match) {
            let token = jwt.sign({ id: checkUser._id }, 'AmanTandon', { expiresIn: (60 * 60) / 2 });
          return  res.status(200).send({ status: true, 'message': "User login successfull", 'data': { 'token': token, "id": checkUser._id } })
        } return res.status(400).send({ 'msg': 'invalid password' })
    } catch (err) {
        res.status(500).send({ status: false, 'error': err })
    }
}
////////////////////////////To get profile///////////////////////////////////////////////////
const userProfile = async function (req, res) {
    try {
        let id = req.params.userId
        let userProfile = await userModel.findById({ _id: id })
        if (!userProfile) {
            return res.status(404).send({ status: false, 'msg': "document doesnot exist" })
        }
        return res.status(200).send({ status: true, 'data': userProfile })
    } catch (err) {
        res.status(500).send({ 'error': err })
    }
}
////////////////////////////////to update details////////////////////////////////////////////////
const updateUser = async function (req, res) {
    try {
        let id = req.params.userId
        console.log(id)        
        if (!id) {
            return res.status(400).send({ status: false, "msg": "id is required" })
        }
        let tid=req.headers.tid
        if(!(tid==id)){
            console.log('hello')
            return res.status(403).send({'msg':'authentication failed'})
        }
        console.log('bye')
        let data = req.body
        let file = req.files
        const addStr = req.body.address
        const addObj = JSON.parse(addStr)
        let updateData = {}
        if (data.fname) {
            updateData['fname'] = data.fname
        }
        if (data.lname) {
            updateData['lname'] = data.lname
        }
        if (data.phone) {
            updateData['phone'] = data.phone
        }
        if (data.email) {
            updateData['email'] = data.email
        }
        if (data.password) {
            const salt = bcrypt.genSaltSync(saltRounds);
            const hash = bcrypt.hashSync(data.password, salt);
            updateData['password'] = hash
        }
        if (data.address) {
            updateData['address'] = addObj
        }

        if (file && file.length > 0) {
            //upload to s3 and return true..incase of error in uploading this will goto catch block( as rejected promise)
            let uploadedFileURL = await uploadFile(file[0]); // expect this function to take file as input and give url of uploaded file as output 
            // return uploadedFileURL;
            updateData['profileImage'] = uploadedFileURL
        }
        /////////////////////////////////////////////////////////////////////////////////////////////////////
        if (!isValidRequestBody(data)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide blog details' })
            return
        }
        if (!isValid(data.fname)) {
            res.status(400).send({ status: false, message: 'first name is required' })
            return
        }
        if (!isValid(data.lname)) {
            res.status(400).send({ status: false, message: 'last name  is required' })
            return
        }
        if (!isValid(data.email)) {
            res.status(400).send({ status: false, message: 'email is required' })
            return
        }
        if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.email))) {
            res.status(400).send({ status: false, message: `Email should be a valid email address` })
            return
        }
        isEmailAlreadyExist=await userModel.findOne({email:data.email})
        if(isEmailAlreadyExist){
            return res.status(400).send({'msg':'email already exist'})
        }
        if (!isValid(data.phone)) {
            res.status(400).send({ status: false, message: 'phone num is required' })
            return
        }
        if (!(/^[6-9]{1}[0-9]{9}$/.test(data.phone))) {
            res.status(400).send({ status: false, message: `phone should be a valid mobile number` })
            return
        }
        isPhoneAlreadyExist=await userModel.findOne({phone:data.phone})
        if(isPhoneAlreadyExist){
            return res.status(400).send({'msg':'phone already registered'})
        }
        if (!isValid(data.password)) {
            res.status(400).send({ status: false, message: 'password is required' })
            return
        }
        if (!isValidPassword(data.password)) {
            res.status(400).send({ status: false, message: 'invalid password length' })
            return
        }
        if (!isValid(file)) {
            res.status(400).send({ status: false, message: 'file is required' })
            return
        }
        if (!isValidObject(addObj)) {
            res.status(400).send({ status: false, message: 'address is required' })
            return
        }
        if (!isValidObject(addObj.shipping)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide blog details' })
            return
        }
        if (!isValid(addObj.shipping.street)) {
            res.status(400).send({ status: false, message: 'street is required' })
            return
        }
        if (!isValid(addObj.shipping.city)) {
            res.status(400).send({ status: false, message: 'street is required' })
            return
        }
        if (!isValidNumber(addObj.shipping.pincode)) {
            res.status(400).send({ status: false, message: 'street is required' })
            return
        }
        if (!(/^[1-9][0-9]{5}$/.test(addObj.shipping.pincode))) {
            res.status(400).send({ status: false, message: `pincode should be  valid ` })
            return
        }
        if (!isValidObject(addObj.billing)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide blog details' })
            return
        }
        if (!isValid(addObj.billing.street)) {
            res.status(400).send({ status: false, message: 'street is required' })
            return
        }
        if (!isValid(addObj.billing.city)) {
            res.status(400).send({ status: false, message: 'street is required' })
            return
        }
        if (!isValidNumber(addObj.billing.pincode)) {
            res.status(400).send({ status: false, message: 'street is required' })
            return
        }
        if (!(/^[1-9][0-9]{5}$/.test(addObj.billing.pincode))) {
            res.status(400).send({ status: false, message: `pincode should be  valid ` })
            return
        }
        console.log('meow')

        ///////////////////////////////////////////////////////////////////////////////////////////////////// 
        let updatedUser = await userModel.findOneAndUpdate({ _id: id }, updateData, { new: true })
        res.status(200).send({ status: true, 'updatedUser': updatedUser })
    } catch (err) {
        res.status(500).send({ status: 500, 'error': err })
    }
}
module.exports = { registerUser, login, userProfile, updateUser }