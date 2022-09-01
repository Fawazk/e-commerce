const addToCart=(prodId)=>{
        $.ajax({
            url:'/add-to-cart?id='+prodId,
            method:'get',
            success:((responce)=>{
                if (responce.status){
                    let count = $('#cart-count').html()
                    console.log(count,'count')
                    if(count){
                        count = parseInt(count)+1
                        $('#cart-count').html(count)
                    }else{
                        $('#cart').html('cart'+'<span id="cart-count" class="position-absolute top-0 start-200 badge rounded-pill bg-success">'+1+'</span>')
                    }
                }
            })
        })
    }

const changeQuantity = (cartId, prodId, userId,count) => {
    console.log(cartId, prodId, count);
    let quantity = parseInt(document.getElementById(prodId).value)
    count = parseInt(count)

    $.ajax({
        url: '/change-product-quantity',
        data: {
            user:userId,
            product: prodId,
            cart: cartId,
            count: count,
            quantity:quantity
        },
        method:'post',
        success:(response)=>{
            if(response.removeProduct){
                alert('product removed')
                location.reload()
            }else{
                document.getElementById(prodId).value= quantity+count
                document.getElementById('total').innerHTML = response.total
        }
    }
    })
}

const deleteCartProduct=(cart,product)=>{
    $.ajax({
        url:'/delete-cart-product',
        data:{
            cart:cart,
            product:product,
        },
        method:'post',
        success:(res)=>{
            alert(res)
            location.reload()
        }
    })
}
