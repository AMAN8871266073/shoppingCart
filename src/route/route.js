const express=require("express")
const router=express.Router()
const userModel=require('../controllers/userController')
const userController=require('../controllers/userController')
const productController=require('../controllers/productController')
const cartController=require('../controllers/cartController')
const orderController=require('../controllers/orderController')
const middleware=require("../middlewares/middleware")
////////////////////////////User Endpoints////////////////////////////////////////////////////////////////
router.post('/register',userController.registerUser)
router.post('/login',userController.login)
router.get('/user/:userId/profile',middleware.authorize,userController.userProfile)
router.put('/users/:userId/profile',middleware.authorize,userController.updateUser)
/////////////////////////////Product Endpoints/////////////////////////////////////////////////////////////////
router.post('/products',productController.createProduct)
router.get('/products',productController.findProduct)
router.get('/products/:productId',productController.productById)
router.put('/products/:productId',productController.updateProduct)
router.delete('/products/:productId',productController.deleteProduct)
/////////////////////////////Cart Endpoints//////////////////////////////////////////////////////////////////
router.post('/users/:userId/cart',middleware.authorize,cartController.createCart)
router.put('/users/:userId/cart',middleware.authorize,cartController.updateCart)
router.get('/users/:userId/cart',middleware.authorize,cartController.cartDetail)
router.delete('/users/:userId/cart',middleware.authorize,cartController.deleteCart)
////////////////////////////////Order Endpoints//////////////////////////////////////////////////////////////
router.post('/users/:userId/orders',middleware.authorize,orderController.createOrder)
router.put('/users/:userId/orders',middleware.authorize,orderController.updateOrder)
router.delete('/users/:userId/orders',middleware.authorize,orderController.deleteOrder)
/////////////////////////////////////////////////////////////////////////////////////////////////
module.exports=router