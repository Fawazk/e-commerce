var express = require('express');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
  productHelpers.getAllProducts().then((products) => {
    // console.log(products);
    res.render('admin/view-product', { products, admin: true });
  })

});
// view Add Prducts
router.get('/add-product', (req, res, next) => {
  res.render('admin/add-product', { admin: true });
});

// add product
router.post('/add-product', (req, res, next) => {
  productHelpers.addproduct(req.body, (id) => {
    let image = req.files.Image
    // console.log(id);
    image.mv('./public/product-images/' + id + '.jpg', (err, done) => {
      if (!err) {
        res.redirect('/admin/')
      } else {
        console.log(err)
      }
    })
  })
});

router.get('/delete-product', (req, res, next) => {
  let prodId = req.query.id
  productHelpers.deleteProduct(prodId).then((response) => {
    res.redirect('/admin/')
  })
});

router.get('/edit-product', async (req, res, next) => {
  let prodId = req.query.id
  const product = await productHelpers.getProductDetails(prodId)
  console.log(product);
  res.render('admin/edit-product', { product })
})

router.post('/edit-product', async (req, res, next) => {
  let prodId = req.query.id
  productHelpers.updateProduct(prodId, req.body).then(() => {
    res.redirect('/admin/')
    if (req.files.Image) {
      let image = req.files.Image
      image.mv('./public/product-images/' + prodId + '.jpg')
    }
  })
})

module.exports = router;

