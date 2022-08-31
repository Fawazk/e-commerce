const { response } = require('express')
const db = require('../config/connection')
const collection = require('./collection')
const objectId=require('mongodb').ObjectId

module.exports={
    addproduct:(product,callback)=>{
        db.get().collection('product').insertOne(product).then((data)=>{
            callback(data.insertedId)
        })
    },
    getAllProducts :()=>{
        return new Promise(async (resolve,reject)=>{
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(prodId)}).then((response)=>{
                console.log(response)
                resolve(response)
            })
        })
    },
    getProductDetails:(prodId)=>{
        return new Promise(async(resolve,reject)=>{
            const product=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(prodId)})
            resolve(product)
        })
    },
    updateProduct:(prodId,prodDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(prodId)},{$set:{
                name:prodDetails.name,
                description:prodDetails.description,
                price:prodDetails.price
            }}).then((response)=>{
                console.log(response,'hai this is update product')
                resolve(response)
            })
        })
    }
}