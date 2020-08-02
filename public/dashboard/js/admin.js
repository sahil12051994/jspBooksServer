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
  let getMyBooksVal = await getMyBooks();
});

function fillMyUserList(res) {
  let tempHtml = '';
  $('#myUserList').html('');
  for (var i = 0; i < res.length; i++) {
    tempHtml = tempHtml + '<tr uId="'+res[i]['_id']+'">\
      <td>' + res[i]['profile']['name'] + '</td>\
      <td>' + res[i]['email'] + '</td>\
      <td>Teacher</td>\
      <td>--</td>\
      <td style="text-align: center;">' + res[i]['_id'] + '</td>\
      <td><button type="button" class="btn btn-block btn-warning grantAccessToBooks">Grant Access To Books</button></td>\
      <td class="text-right py-0 align-middle">\
        <div class="btn-group btn-group-sm">\
          <a href="#" class="btn btn-info"><i class="fas fa-eye"></i></a>\
          <a href="#" class="btn btn-default"><i class="fa fa-shopping-cart" aria-hidden="true"></i></a>\
          <a href="#" class="btn btn-danger"><i class="fas fa-trash"></i></a>\
        </div>\
      </td>\
    </tr>'
  }
  $('#myUserList').html(tempHtml);
}

$(document).on('click', '.grantAccessToBooks', async function() {
  let uId = $(this).parents('tr').attr('uId')
  data = {
    uId: uId,
    body: {
      permission: {
        grantAccessToAllBooks: true
      }
    }
  }

  let updateUser = await updateUserInfo(data);
  console.log(updateUser)
})

function updateUserInfo(data) {
  return new Promise(function(resolve, reject) {
    $.ajax({
      url: serviceUrl + "jsp/user/update/" + data.uId,
      type: "PUT",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      crossDomain: true,
      data: JSON.stringify(data.body),
      beforeSend: function(request) {
        request.setRequestHeader('Authorization', authToken);
        request.setRequestHeader("Access-Control-Allow-Origin", "*");
      },
      success: function(res) {
        toastr["success"]("Access Granted")
        resolve()
      },
      error: function(err) {}
    });
  })
}

function getMyBooks() {
  return new Promise(function(resolve, reject) {
    $.ajax({
      url: serviceUrl + "jsp/user",
      type: "GET",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      crossDomain: true,
      beforeSend: function(request) {
        request.setRequestHeader('Authorization', authToken);
        request.setRequestHeader("Access-Control-Allow-Origin", "*");
      },
      success: function(res) {
        fillMyUserList(res)
        resolve()
      },
      error: function(err) {}
    });
  })
}
