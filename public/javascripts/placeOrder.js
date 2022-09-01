$('#checkout-form').submit((e)=>{
    e.preventDefault()
    $.ajax({
        url:'/place-order',
        method:'post',
        data:$('#checkout-form').serialize(),
        success:(response)=>{
            alert(response)
            if (response.status){
                location.href='/order-success'
            }
        }
    })
})