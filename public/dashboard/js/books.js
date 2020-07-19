$(window).on('load', async function() {

  // let urlUserId = $.cookie("uId") ? $.cookie("uId") : getUrlParameter('usr');
  // $.ajax({
  //   url: serviceUrl + "face/user/" + urlUserId,
  //   type: "GET",
  //   contentType: "application/json; charset=utf-8",
  //   dataType: "json",
  //   crossDomain: true,
  //   beforeSend: function(request) {
  //     request.setRequestHeader('Authorization', authToken);
  //     request.setRequestHeader("Access-Control-Allow-Origin", "*");
  //   },
  //   success: function(res) {
  //     $(".user_name").html(res.profile.name);
  //     currentUser = res;
  //     $.cookie("uId", res._id)
  //     if (res.email != 'sashank@gmail.com') {
  //       $('#maskingMenu').remove()
  //     }
  //   },
  //   error: function(err) {}
  // });
  let getUploadedBooksVal = await getUploadedBooks();
});

function fillUploadedBooksList(res) {
  $('#allBooksList').html('');
  let tempHtml = '';
  for (var i = 0; i < res.length; i++) {
    tempHtml = tempHtml + '<div class="callout callout-success">\
                      <h5>'+res[i]['bookName']+'</h5>\
                      <p>'+res[i]['bookId']+',  '+text_truncate(res[i]['bookDescription'],500)+'</p>\
                    </div>'
  }
  $('#allBooksList').html(tempHtml);
}

function getUploadedBooks() {
  return new Promise(function(resolve, reject) {
    $.ajax({
      url: serviceUrl + "jsp/book/",
      type: "GET",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      crossDomain: true,
      beforeSend: function(request) {
        request.setRequestHeader('Authorization', authToken);
        request.setRequestHeader("Access-Control-Allow-Origin", "*");
      },
      success: function(res) {
        fillUploadedBooksList(res)
        resolve()
      },
      error: function(err) {}
    });
  })
}
