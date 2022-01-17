const cartModel = require("../models/cartModel")
const userModel = require('../models/userModel')
const productModel = require("../models/productModel")
const mongoose = require('mongoose')
///////////////////////////////////////////////////////////////////////////////////////////////////////
const total = function (list) {
    let priceSum = 0
    for (let i = 0; i < list.length; i++) {
        priceSum = (priceSum + list[i].productId.price * list[i].quantity)
    }
    return priceSum
}
////////////////////////////////////////////////////////////////////////////////////
const productChecker = function (list, p_id) {
    for (let i = 0; i < list.length; i++) {
        console.log(p_id)
        console.log(list[i].productId._id)
        if (p_id == list[i].productId._id) {
            return true
            break
        }
    } return false
}
const productIndexFinder = function (list, p_id) {
    for (let j = 0; j < list.length; j++) {
        //console.log(p_id)
        //console.log(list[j].productId)
        if (p_id == list[j].productId._id) {
            return j
            break
        }
    } return -1
}
//////////////////////////////////////////////////////////////////////////////////////////
const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}
const isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}
////////////////////////////////////////////////////////////////////////////////////////////////
const createCart = async function (req, res) {
    try {
        const u_Id = req.params.userId   
        let isUserExist = await userModel.findById({_id:u_Id})
        if (!isUserExist) {
            return res.status(404).send({ 'msg': 'user doesnot exist with given id' })
        }
        ///////////////////////////////////////////////////////////////////////////////////////////////   
        
        let requestBody = req.body
        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: ' Please provide cart details' })
        }
        let productId = requestBody.productId
        let productQuantity = requestBody.quantity
        if (productQuantity < 1) {
            return res.status(400).send({ 'msg': 'minimum product quantity is required' })
        }
        if (productId) {
            if (isValidObjectId(productId)) {
                isProductExist = await productModel.findOne({ _id: productId, isDeleted: false })
                if (!isProductExist) {
                    return res.status(404).send({ 'msg': 'product doesnot exist with given product id' })
                }
            } else {
                res.status(400).send({ 'msg': 'invalid product Id' })
            }

        } else {
            return res.status(400).send({ 'msg': 'product id is required' })
        }
        let isCartExist = await cartModel.findOne({ userId: u_Id }).populate("items.productId")
        if (isCartExist) {
            cartId = isCartExist._id
            const list = isCartExist.items
            let p_id = requestBody.productId
            let isproductAlreadyExist = productChecker(list, p_id)
            if (isproductAlreadyExist == true) {
                return res.status(200).send({ 'msg': 'product already exist in cart', 'cart': isCartExist })
            }
            list.push(requestBody)
            updatedList = await cartModel.findOneAndUpdate({_id: cartId }, { items: list }, { new: true }).populate("items.productId")
            let data = {
                userId: u_Id,
                items: updatedList.items,
                totalPrice: total(updatedList.items),
                totalItems: updatedList.items.length
            }
            updatedCart = await cartModel.findOneAndUpdate({ _id: cartId }, data, { new: true }).populate("items.productId")
            if (updatedCart) {
                return res.status(202).send({ 'cartUpdated': updatedCart })
            } else {
                return res.status(400).send('product not added to cart')
            }
        }

        let data = {
            userId: u_Id,
            totalPrice: 0,
            totalItems: 0
        }
        let newCart = await cartModel.create(data)
        console.log(newCart)
        res.status(202).send({ 'msg': 'empty cart created' })
    } catch (err) {
        res.status(500).send({ 'error': err })
    }
}
//////////////////////////////////////////////////////////////////////////////////////////////////////
const updateCart= async function (req, res) {
    try {
        let u_Id = req.params.userId
        isUserExist = await userModel.findById({ _id: u_Id })
        if (!isUserExist) {
            return res.status(404).send({ 'msg': "user doesnot exist" })
        }
        let cartId = req.body.cartId
        let isCartExist = await cartModel.findById({_id:cartId}).populate("items.productId")
        if (!isCartExist) {
            return res.status(404).send({ 'msg': "cart doesnot exist" })
        }
        let tid=req.headers.tid
        if(!(tid==isCartExist.userId)){
            return res.status(403).send({'msg':'authentication failed'})
        }
        let p_Id = req.body.productId
        let isProductExist = await productModel.findOne({ _id: p_Id, isDeleted: false })
        if (!isProductExist) {
            return res.status(404).send({ 'msg': 'product doesnot exist' })
        }
        let key = req.body.removeProduct
        if (key == 0 || key == 1) {
            let list = isCartExist.items
            //console.log(list)
            let index = productIndexFinder(list, p_Id)
            if (index == -1) {
                return res.status(404).send({ 'msg': 'product not found in cart' })
            }
            if (key == 0) {
                list.splice(index, 1)
                let data = {
                    userId: req.params.userId,
                    items: list,
                    totalPrice: total(list),
                    totalItems: list.length
                }

                let updatedCart = await cartModel.findOneAndUpdate({_id: cartId }, data, { new: true })
            }
            if (key == 1) {
                let productQty = list[index].quantity
                if (productQty == 1) {
                    return res.status(400).send({ 'msg': 'minimum quantity 1 is required' })
                }
                productQty = productQty - 1
                list[index].quantity = productQty
                let data = {
                    userId: req.params.userId,
                    items: list,
                    totalPrice: total(list),
                    totalItems: list.length
                }
                let updatedCart = await cartModel.findOneAndUpdate({_id: cartId }, data, { new: true })
                res.status(200).send({ 'msg': "product quantity updated" })
            }
        }
        else {
            res.status(400).send({ 'msg': 'invalid input' })
        }
    } catch (err) {
        return res.status(500).send({ 'error': err })
    }
}
///////////////////////////////////////////////////////////////////////////////////////
const cartDetail = async function (req, res) {
    try {
        const u_Id = req.params.userId
        let isUserExist = await userModel.findById({_id:u_Id})
        if (!isUserExist) {
            return res.status(404).send({ 'msg': 'user doesnot exist with given id' })
        }
        const isCartExist = await cartModel.findOne({ userId: u_Id }).populate("items.productId")
        if (!isCartExist) {
            return res.status(404).send({ 'msg': 'cart doesnot exist with this userId' })
        }
        let tid=req.headers.tid
        if(!(tid==isCartExist.userId)){
            return res.status(403).send({'msg':'authentication failed'})
        }
        return res.status(200).send({ "cart": isCartExist })

    } catch (err) {
        res.status(500).send({ "error": err })
    }
}
const deleteCart = async function (req, res) {
    try {
        const u_Id = req.params.userId
        let isUserExist = await userModel.findById({_id:u_Id})
        if (!isUserExist) {
            return res.status(404).send({ 'msg': 'user doesnot exist with given id' })
        }
        const isCartExist = await cartModel.findOne({ userId: u_Id }).populate("items.productId")
        if (!isCartExist) {
            return res.status(500).send({ 'msg': 'cart doesnot exist with this userId' })
        }
        let tid=req.headers.tid
        if(!(tid==isCartExist.userId)){
            return res.status(403).send({'msg':'authentication failed'})
        }
        let data = {
            //userId: req.params.userId,
            items: [],
            totalPrice: 0,
            totalItems: 0
        }
        let deletedCart = await cartModel.findOneAndUpdate({ userId: u_Id }, data, { new: true })
        //console.log('yooooooooo')
        if (deletedCart) {
            return res.status(200).send({ 'msg': "cart deleted successfully" })
        }

    } catch (err) {
        res.status(500).send({ "error": err })
    }
}
/////////////////////////////////////////////////////////////////////////////////////////////
module.exports = { createCart,updateCart,cartDetail,deleteCart }