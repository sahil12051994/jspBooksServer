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

function getAllUploadBookFormDetails() {
  let bookObject = {
    bookId: $("#bookId").val(),
    bookAuthor: $("#bookAuthor").val(),
    bookTags: $("#bookTags").val().split(","),
    bookPrice: parseFloat($("#bookPrice").val()),
    bookDescription: $("#bookDescription").val(),
    bookName: $("#bookName").val(),
    bookPages: [{
      pageNumber: 1,
      pageImagePath: "/uploads/books/mathsBySahil/1.png",
      pageText: "",
      pageTags: ["maths", "algebra"]
    },{
      pageNumber: 2,
      pageImagePath: "/uploads/books/mathsBySahil/1.png",
      pageText: "",
      pageTags: ["maths", "algebra"]
    }]
  }
  console.log(bookObject)
}

function fillUploadedBooksList(res) {
  $('#uploadedBooksList').html('');
  let tempHtml = '';
  for (var i = 0; i < res.length; i++) {
    tempHtml = tempHtml + '<div class="callout callout-success">\
                      <h5>'+res[i]['bookName']+'</h5>\
                      <p>'+res[i]['bookId']+',  '+text_truncate(res[i]['bookDescription'],200)+'</p>\
                    </div>'
  }
  $('#uploadedBooksList').html(tempHtml);
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
