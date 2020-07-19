let globalBookToView = {}

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

function showImages(res) {
  let imagesArray = res['bookPages']
  let tempHtml = '';
  $("#bookDiv").html('');
  for (var i = 0; i < imagesArray.length; i++) {
    tempHtml = tempHtml + '<div class="col-md-12">\
      <img class="img-responsive" src="/jsp'+imagesArray[i]['pageImagePath']+'" style="width:100%">\
    </div>'
  }
  $("#bookDiv").html(tempHtml);
}

$(document).on('change', '#validBookList', function() {
  let bookId = $(this).val();
  $.ajax({
    url: serviceUrl + "jsp/book?" + "bookId=" + bookId,
    type: "GET",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    crossDomain: true,
    beforeSend: function(request) {
      request.setRequestHeader('Authorization', authToken);
      request.setRequestHeader("Access-Control-Allow-Origin", "*");
    },
    success: function(res) {
      globalBookToView = res[0]
      showImages(globalBookToView)
    },
    error: function(err) {}
  });
})

function fillUploadedBooksList(res) {
  $('#validBookList').html('');
  let tempHtml = '<option>Select book to view</option>';
  for (var i = 0; i < res.length; i++) {
    tempHtml = tempHtml + '<option value="'+res[i]['bookId']+'">'+res[i]['bookName']+'</option>'
  }
  $('#validBookList').html(tempHtml);
  $('#validBookList').select2({
    theme: 'bootstrap4'
  })
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
