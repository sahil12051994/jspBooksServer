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
  let getMyBooksVal = await getMyBooks();
});

function fillUploadedBooksList(res) {
  $('#allBooksList').html('');
  let tempHtml = '';
  for (var i = 0; i < res.length; i++) {
    tempHtml = tempHtml + '<div class="callout callout-success">\
                      <div class="row" bId="'+res[i]['_id']+'">\
                      <div class="col-md-1">\
                      <img class="n3VNCb img-responsive" src="https://upload.wikimedia.org/wikipedia/commons/2/24/HowtoEataSmallCountry_cover.png" jsname="HiaYvf" jsaction="load:XAeZkd,gvK6lb;" data-iml="22970.209999999497" style="width: 100px;margin: 0px;">\
                      </div>\
                      <div class="col-md-9">\
                      <h5>' + res[i]['bookName'] + '</h5>\
                      <p>' + res[i]['bookId'] + ',  ' + text_truncate(res[i]['bookDescription'], 500) + '</p>\
                      </div>\
                      <div class="col-md-2">\
                      <button type="button" class="btn btn-block bg-gradient-info btn-lg">Info</button>\
                      <button type="button" class="btn btn-block bg-gradient-info btn-lg">Buy</button>\
                      </div>\
                      </div>\
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

function fillMyBooksList(res) {
  let tempHtml = '';
  $('#myBooksList').html('');
  for (var i = 0; i < res.length; i++) {
    tempHtml = tempHtml + '<tr bId="'+res[i]['_id']+'">\
      <td>' + res[i]['bookName'] + '</td>\
      <td>' + res[i]['bookAuthor'] + '</td>\
      <td>49.8005 kb</td>\
      <td class="text-right py-0 align-middle">\
        <div class="btn-group btn-group-sm">\
          <a href="#" class="btn btn-info"><i class="fas fa-eye"></i></a>\
          <a href="#" class="btn btn-default"><i class="fa fa-shopping-cart" aria-hidden="true"></i></a>\
          <a href="#" class="btn btn-danger"><i class="fas fa-trash"></i></a>\
        </div>\
      </td>\
    </tr>'
  }
  $('#myBooksList').html(tempHtml);
}

function getMyBooks() {
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
        fillMyBooksList(res)
        resolve()
      },
      error: function(err) {}
    });
  })
}
