const { response } = require('express');
var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers')

const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}
const getCartCount=async(user)=>{
  let cartCount = 0
  if (user) {
    cartCount = await userHelpers.getCartCount(user._id)
  }
  return cartCount
}

/* GET home page. */
router.get('/', async function (req, res, next) {
  let user = req.session.user
  const cartCount = await getCartCount(user)
  productHelpers.getAllProducts().then((products) => {
    res.render('user/view-products', { products, user, cartCount });
  })
});

router.get('/login', (req, res, next) => {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else
    res.render('user/login', { loginErr: req.session.loginErr });
  req.session.loginErr = false
});

router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect('/')
    } else {
      req.session.loginErr = "username of password is invalid"
      res.redirect('/login')
    }
  })
})

// logout
router.get('/logout', (req, res, next) => {
  req.session.destroy()
  res.redirect('/')
});


router.get('/signup', (req, res, next) => {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else
    res.render('user/signup');
});
router.post('/signup', (req, res) => {
  userHelpers.doUsers(req.body).then((user) => {
    console.log(user)
    req.session.loggedIn = true
    req.session.user = user
    res.redirect('/')
  })
})

// cart
router.get('/cart', verifyLogin, async (req, res) => {
  let user = req.session.user
  const cartCount = await getCartCount(user)
  let cartItems=null
  let totalValue = 0
  if (cartCount){
    cartItems = await userHelpers.getCartProducts(user._id)
    totalValue = await userHelpers.getTotalAmount(user._id)
  }
  res.render('user/cart', { cartItems,user,totalValue,cartCount });
})

// Add to cart
router.get('/add-to-cart', (req, res) => {
  pId = req.query.id
  user = req.session.user
  userHelpers.addToCart(pId, user._id).then(() => {
    res.json({status:true})
  })
})

// change cart product quantity
router.post('/change-product-quantity',(req,res)=>{
  userHelpers.changeProductQuantity(req.body).then(async(responce)=>{
    responce.total=await userHelpers.getTotalAmount(req.body.user)
    console.log(req.body.user);
    console.log(responce.total,'responce.total')
    res.json(responce)
  })
})

// delete product from cart
router.post('/delete-cart-product',(req,res)=>{
  userHelpers.deleteCartProduct(req.body).then((responce)=>{
    res.json(responce)
  })
})

// place order
router.get('/place-order',verifyLogin,async (req, res) => {
  let user = req.session.user
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place-order.hbs',{total,user});
})
router.post('/place-order',verifyLogin,async(req,res)=>{
  const products = await userHelpers.getCartProductList(req.body.userId)
  const totalAmount = await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body,products,totalAmount).then((response)=>{
    res.json({status:true})
  })
})
module.exports = router;