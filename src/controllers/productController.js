const productModel = require("../models/productModel")
const getSymbolFromCurrency = require('currency-symbol-map')
const mongoose = require('mongoose')
const objectId = mongoose.Types.ObjectId

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}

format = getSymbolFromCurrency('INR')
//////////////////////////////AWS//////////////////////////////////////////////////
const aws = require("aws-sdk");

aws.config.update({
    accessKeyId: "AKIAY3L35MCRRMC6253G",  // id
    secretAccessKey: "88NOFLHQrap/1G2LqUy9YkFbFRe/GNERsCyKvTZA",  // like your secret password
    region: "ap-south-1" // Mumbai region
});
let uploadFile = async (file) => {
    return new Promise(function (resolve, reject) { // exactly 

        // Create S3 service object
        let s3 = new aws.S3({ apiVersion: "2006-03-01" });
        var uploadParams = {
            ACL: "public-read", // this file is publically readable
            Bucket: "classroom-training-bucket", // HERE
            Key: "product/" + file.originalname, // HERE    "pk_newFolder/harry-potter.png" pk_newFolder/harry-potter.png
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
/////////////////////////////////////////////////////////////////////////////////////////////
const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}
const isValidNumber = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'number') return true
    return false;
}
const isValidObject = function (value) {
    return Object.keys(value).length > 0
}
///////////////////////////////register product//////////////////////////////////////
const createProduct = async function (req, res) {
    try {
        let data = req.body
        if (!isValidObject(data)) {
            res.status(400).send({ status: false, message: 'address is required' })
            return
        }
        let product = {}
        if (!isValid(data.title)) {
            res.status(400).send({ status: false, message: 'title  is required' })
            return
        }
        let isProduct = await productModel.findOne({ title: data.title,isDeleted:false })
        if (isProduct) {
            return res.status(200).send({ status: true, 'msg': "product already exist with this title", 'product': isProduct })
        }

        product['title'] = data.title.trim()
        if (!isValid(data.description)) {
            res.status(400).send({ status: false, message: 'title  is required' })
            return
        }
        product['description'] = data.description.trim()
        let mrp = Number(data.price)
        console.log(mrp)
        if (!(typeof mrp == 'number')) {
            return res.status(400).send({ status: false, message: 'price is required' })
        }

        product['price'] = data.price
        if (!(data.currencyId == 'INR')) {
            return res.status(400).send({ status: false, 'msg': "invalid currency Id" })

        }
        product['currencyId'] = data.currencyId
        if (!(format == "₹")) {
            return res.status(400).send({ status: failed, 'msg': "invalid currency format" })
        }
        product['currencyFormat'] = format
        if (!(data.isFreeShipping == 'true' || data.isFreeShipping == 'false')) {
            return res.status(400).send({ status: false, 'msg': 'invalid shipping status' })
        }
        product['isFreeShipping'] = data.isFreeShipping
        /////////////////////////////////////////////////////////////////////////////////////////////////
        const file = req.files
        if (file && file.length > 0) {
            //upload to s3 and return true..incase of error in uploading this will goto catch block( as rejected promise)
            var uploadedFileURL = await uploadFile(file[0]); // expect this function to take file as input and give url of uploaded file as output 
            // return uploadedFileURL;
        }
        else {
            res.status(400).send({ status: false, msg: "No file to write" });
        }
        //////////////////////////////////////////////////////////////////////////////////////
        product['productImage'] = uploadedFileURL
        if (!isValid(data.style)) {
            res.status(400).send({ status: false, message: 'title  is required' })
            return
        }
        product['style'] = data.style
        let sizeArray = ['S', 'XS', 'M', 'X', 'L', 'XXL', 'XL']
        let arrayOne = data.availableSizes.split(" ")
        let size = arrayOne

        let productSize = []
        for (let i = 0; i < size.length; i++) {
            for (let j = 0; j < sizeArray.length; j++) {
                if (size[i] == sizeArray[j]) {
                    productSize.push(size[i])
                    break
                }
            }
        }
        console.log(productSize)
        if (!(productSize.length > 0)) {
            return res.status(400).send({ status: false, 'msg': 'valid available size is required' })
        }
        product['availableSizes'] = productSize
        let inst = Number(data.installments)
        if (!(typeof inst == 'number')) {
            res.status(400).send({ status: false, message: 'invalid installment' })
            return
        }
        product['installments'] = inst
        let createdProduct = await productModel.create(product)
        console.log(createdProduct)
        if (createdProduct) {
            res.status(201).send({ status: true, 'product': createdProduct })
        }
    } catch (err) {
        res.status(500).send({ status: false, 'error': err })
    }
}
/////////////////////////////////get products/////////////////////////////////////////////////////////
const findProduct = async function (req, res) {
    try {
        let query = req.query
        const { name, size, priceGreaterThan, priceLessThan, priceSort } = query
        const queryObj = { isDeleted: false }
        if (name) {
            queryObj['title'] = new RegExp(name, 'i')
        }
        if (size) {
            queryObj['availableSizes'] = size
        }
        if (priceGreaterThan) {
            queryObj['price'] = { $gt: priceGreaterThan }
        }
        if (priceLessThan) {
            queryObj['price'] = { $lt: priceLessThan }
        }
        if (priceGreaterThan && priceLessThan) {
            queryObj['price'] = { $gt: priceGreaterThan, $lt: priceLessThan }
        }
        if (priceSort) {
            let filteredProductList = await productModel.find(queryObj).sort({ price: priceSort })
            return res.status(200).send({ data: filteredProductList })
        }
        console.log(queryObj)
        let filteredProductList = await productModel.find(queryObj)
        return res.status(200).send({ data: filteredProductList })
    } catch (err) {
        return res.status(500).send({ 'error': err })
    }
}
////////////////////////////////////////ProductById////////////////////////////////////////////////
const productById = async function (req, res) {
    try {
        const id = req.params.productId
        if (objectId.isValid(id)) {
            let product = await productModel.findById({_id:id,isDeleted:false})
            if (product) {
                return res.status(200).send({ data: product })
            }
            res.status(404).send({ 'msg': 'product not found by given id' })
        }
        return res.status(400).send({ 'msg': 'product id is required' })
    } catch (err) {
        res.status(500).send({ 'error': err })
    }
}
////////////////////////////////To update product details////////////////////////////////////////////////////
const updateProduct = async function (req, res) {
    try {
        let update = req.body
        let id = req.params.productId
        if (!(isValidRequestBody(update))) {
            return res.status(400).send({ 'msg': 'invalid id ' })
        }
        let updatedProduct = await productModel.findOneAndUpdate({ _id: id, isDeleted: false }, update, { new: true })
        if (updatedProduct) {
            return res.status(200).send({ "updated": updatedProduct })
        }
        return res.status(404).send({ "msg": "product not found with given Id" })
    } catch (err) {
        res.status(500).send({ 'error': err })
    }
}
/////////////////////////////To delete product////////////////////////////////////////////
const deleteProduct = async function (req, res) {
    try {
        let id = req.params.productId
        if (objectId.isValid(id)) {
            let updatedProduct = await productModel.findOneAndUpdate({ _id: id, isDeleted: false }, { isDeleted: true }, { new: true })
            if (updatedProduct) {
                return res.status(200).send({ 'msg': 'product deleted successfully' })
            }
            return res.status(404).send({ 'msg': "document not found" })
        }
        res.status(400).send({ 'msg': 'invalid product Id' })
    } catch (err) {
        return res.staus(500).send({ 'error': err })
    }
}
//////////////////////////////////////////////////////////////////////////////////////////////////
module.exports = { createProduct,findProduct, productById,updateProduct, deleteProduct }