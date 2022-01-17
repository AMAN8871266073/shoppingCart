const orderModel = require('../models/orderModel')
const cartModel = require("../models/cartModel")
const userModel = require("../models/userModel")
const mongoose = require("mongoose")

const totalQty = function (list) {
    let qty = 0
    for (let i = 0; i < list.length; i++) {
        qty = (qty + list[i].quantity)
    }
    return qty
}
const isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}

const createOrder = async function (req, res) {
    try {
        const u_Id = req.params.userId
        let isUserExist = await userModel.findById({ _id: u_Id })
        console.log(isUserExist)
        if (!isUserExist) {
            return res.status(404).send({ 'msg': 'user doesnot exist with given id' })
        }
        isCartExist = await cartModel.findOne({ userId: u_Id })
        let tid = req.headers.tid
        if (!(tid == isCartExist.userId)) {
            return res.status(403).send({ 'msg': 'authentication failed' })
        }
        if (isCartExist.items.length == 0) {
            return res.status(404).send({ 'msg': "cart is empty" })
        }
        if (!isCartExist) {
            return res.status(404).send({ 'msg': "cart doesnot exist for user" })
        }
        let list = isCartExist.items
        let order = {
            userId: u_Id,
            items: list,
            totalPrice: isCartExist.totalPrice,
            totalItems: isCartExist.totalItems,
            totalQuantity: totalQty(list)
        }
        let createdOrder = await orderModel.create(order)

        if (createdOrder) {
            let data = {
                userId: u_Id,
                items: [],
                totalPrice: 0,
                totalItems: 0
            }
            let updatedCart = await cartModel.findOneAndUpdate({ userId: u_Id }, data, { new: true })
            res.status(200).send({ 'msg': 'order created', 'order': createdOrder })
        }
    } catch (err) {
        res.status(500).send({ 'error': err })
    }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////
const updateOrder = async function (req, res) {
    try {
        const u_Id = req.params.userId
        let isUserExist = await userModel.findById({ _id: u_Id })
        if (!isUserExist) {
            return res.status(404).send({ 'msg': 'user doesnot exist with given id' })
        }
        let o_id = req.body.orderId
        let status = req.body.status
        if (!o_id) {
            return res.status(400).send({ 'msg': 'order id is required' })
        }
        if (!(isValidObjectId(o_id))) {
            return res.status(400).send({ 'msg': 'invalid order Id' })
        }
        let isOrderExist = await orderModel.findOne({ _id: o_id, isDeleted: false })
        if (!isOrderExist) {
            return res.status(404).send({ 'msg': 'order doesnot exist with this order id' })
        }
        let tid = req.headers.tid
        if (!(tid == isOrderExist.userId)) {
            return res.status(403).send({ 'msg': 'authentication failed' })
        }
        if (isOrderExist.userId == u_Id) {
            if (status == 'canceled') {
                if (isOrderExist.cancellable == true) {
                    isOrderExist.status = status
                    let updatedOrder = await orderModel.findOneAndUpdate({ _id: o_id, isDeleted: false }, isOrderExist, { new: true })
                    if (updatedOrder) {
                        return res.status(200).send({ 'msg': 'order cancelled successfully' })
                    }
                } else {
                    return res.status(400).send({ 'msg': 'order is not cancellable' })
                }
            }
            isOrderExist.status = status
            let updatedOrder = await orderModel.findOneAndUpdate({ _id: o_id, isDeleted: false }, isOrderExist, { new: true })
            if (updatedOrder) {
                return res.status(200).send({ 'msg': 'order status updated successfully' })
            }
        } else {
            return res.status(401).send({ 'msg': 'user not authorised to update this order' })
        }

    } catch (err) {
        res.status(500).send({ 'error': err })
    }
}
//////////////////////////////////////////////////////////////////////////////////////////////////////
const deleteOrder = async function (req, res) {
    try {
        let o_id = req.body.orderId
        let u_id = req.params.userId
        if (!o_id) {
            return res.status(400).send({ 'msg': 'order id is required' })
        }
        if (!(isValidObjectId(o_id))) {
            return res.status(400).send({ 'msg': 'invalid order Id' })
        }
        let order = await orderModel.findOne({ _id: o_id, isDeleted: false })
        if (order) {
            if (u_id == order.userId) {
                order.isDeleted = true
                let updatedOrder = await orderModel.findOneAndUpdate({ _id: o_id, isDeleted: false }, order, { new: true })
                if (updatedOrder) {
                    return res.status(200).send({ 'msg': 'order deleted successfully' })
                }
                else {
                    return res.status(404).send({ 'msg': 'order to be deleted not found' })
                }
            } else {
                return res.status(401).send({ 'msg': 'user is not authenticated to delete order' })
            }

        } else {
            return res.status(404).send({ 'msg': 'order doesnot exist with this order id' })
        }
    } catch (err) {
        return res.status(500).send({ 'error': err })
    }
}
///////////////////////////////////////////////////////////////////////////////////////
module.exports = { createOrder, updateOrder, deleteOrder }