const db = require('../config/connection')
const collection = require('./collection')
const bcrypt = require('bcrypt')
const objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay');
var instance = new Razorpay({
    key_id: 'YOUR_KEY_ID',
    key_secret: 'YOUR_KEY_SECRET',
});


module.exports = {
    doUsers: (userData) => {
        console.log
        return new Promise(async (resolve, reject) => {
            userData.password = await bcrypt.hash(userData.password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                db.get().collection(collection.USER_COLLECTION).findOne({ _id: data.insertedId }).then((user) => {
                    resolve(user)
                })
            })
        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            console.log(process..razorpay.YOUR_KEY_ID,YOUR_KEY_SECRET)
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (user) {
                console.log(user);
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        resolve(response)
                    }
                })
            } else {
                resolve(response)
            }
        })
    },
    // Add to cart
    addToCart: (prodId, userId) => {
        prodObj = {
            item: objectId(prodId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            const userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                let prodExist = userCart.products.findIndex(product => product.item == prodId)
                if (prodExist != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId), 'products.item': objectId(prodId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }
                        ).then((response) => {
                            resolve()
                        })
                }
                else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) },
                        {
                            $push: { products: prodObj }
                        }).then(() => {
                            resolve()
                        })
                }
            }
            else {
                const cartObj = {
                    user: objectId(userId),
                    products: [prodObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then(() => {
                    resolve()
                })
            }
        })
    },

    // Get CartItems
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: "product"
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            resolve(cartItems)
        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: "$products"
                },
                {
                    $group: {
                        _id: null,
                        count: {
                            $sum: "$products.quantity"
                        },

                    }
                }]).toArray()
            console.log(cart)
            if (cart[0]) {
                resolve(cart[0].count)
            } else {
                resolve()
            }
        })
    },
    // change cart product quantity
    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart) },
                        {
                            $pull: { products: { item: objectId(details.product) } }
                        }
                    ).then(() => {
                        resolve({ removeProduct: true })
                    })
            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }
                        }
                    ).then(() => {
                        resolve({ status: true })
                    })
            }
        })
    },

    // delete cart products
    deleteCartProduct: (data) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION)
                .updateOne({ _id: objectId(data.cart) },
                    {
                        $pull: { products: { item: objectId(data.product) } }
                    }
                ).then((responce) => {
                    resolve(responce)
                })
        })
    },

    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let totalAmount = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: "product"
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', { $convert: { input: '$product.price', to: 'int' } }] } }

                    }
                }
            ]).toArray()
            console.log(totalAmount);
            if (totalAmount[0]) {
                resolve(totalAmount[0].total)
            } else {
                resolve()
            }
        })
    },
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            resolve(cart.products)
        })
    },
    placeOrder: (orderData, products, totalAmount) => {
        return new Promise((resolve, reject) => {
            let status = orderData['paymentMethod'] === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    username: orderData.username,
                    address: orderData.address,
                    mobile: orderData.mobile,
                    pincode: orderData.pincode,
                    state: orderData.state,
                    city: orderData.city,
                },
                user: objectId(orderData.userId),
                paymentMethod: orderData['paymentMethod'],
                products: products,
                totalAmount: totalAmount,
                status: status,
                date: new Date()
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then(() => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(orderData.userId) })
                resolve(responce.insertedId)
            })
        })
    },
    getOrderList: (userId) => {
        return new Promise(async (resolve, reject) => {
            orderList = await db.get().collection(collection.ORDER_COLLECTION).find({ user: objectId(userId) }).toArray()
            resolve(orderList)
        })
    },
    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderProducts = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: "product"
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            console.log(orderId);
            console.log(orderProducts);
            resolve(orderProducts)
        })
    },
    // generateRazorpay: (orderId) => {
    //     return new Promise((resolve, reject) => {

            
    //     })
    // }
}