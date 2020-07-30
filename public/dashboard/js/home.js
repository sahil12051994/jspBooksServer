let globalBookToView = {}

let pageCount = 1

$(window).on('load', async function() {

  let urlUserId = $.cookie("uId") ? $.cookie("uId") : getUrlParameter('usr');
  $.ajax({
    url: serviceUrl + "jsp/user/" + urlUserId,
    type: "GET",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    crossDomain: true,
    beforeSend: function(request) {
      request.setRequestHeader('Authorization', authToken);
      request.setRequestHeader("Access-Control-Allow-Origin", "*");
    },
    success: function(res) {
      $(".user_name").html(res.profile.name);
      $.cookie("uId", res._id)
    },
    error: function(err) {}
  });
  let getUploadedBooksVal = await getUploadedBooks();
});

function showImages(res) {
  let imagesArray = res['files']
  imagesArray.sort(function(a, b) {
    var keyA = (a.number),
      keyB = (b.number);
    // Compare the 2 dates
    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    return 0;
  });
  let tempHtml = '';
  $("#bookDiv").html('');
  for (var i = 0; i < imagesArray.length; i++) {
    tempHtml = tempHtml + '<div class="col-md-12">\
      <img id="pageCount'+(i+1)+'" class="img-responsive" src="/jsp/uploads' + imagesArray[i]['path'] + '" style="width:100%">\
    </div>'
    // tempHtml = tempHtml + '<div class="col-md-12" style="' +
    // 'background-image: url("/jsp/uploads'+imagesArray[i]['path']+'");background-size: auto 100%;background-repeat: no-repeat;background-position: left top;width: 100%;height: 3%;' +
    // '"></div>'
  }
  console.log(tempHtml)
  $("#bookDiv").html(tempHtml);
}

$(document).on('change', '#validBookList', function() {
  let bookId = $(this).val().split('_@_')[0];
  let bookType = $(this).val().split('_@_')[1]
  $.ajax({
    url: serviceUrl + "jsp/book/getBookPages?bookType=" + bookType + "&bookId=" + bookId,
    type: "GET",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    crossDomain: true,
    beforeSend: function(request) {
      request.setRequestHeader('Authorization', authToken);
      request.setRequestHeader("Access-Control-Allow-Origin", "*");
    },
    success: function(res) {
      showImages(res)
    },
    error: function(err) {}
  });
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
    },
    error: function(err) {}
  });
})

function fillUploadedBooksList(res) {
  $('#validBookList').html('');
  let tempHtml = '<option>Select book to view</option>';
  for (var i = 0; i < res.length; i++) {
    tempHtml = tempHtml + '<option value="' + res[i]['bookId'] + '_@_' + res[i]['bookType'] + '">' + res[i]['bookName'] + '</option>'
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

$(document).bind("contextmenu", function(e) {
  return false;
});

function copyToClipboard() {
  // Create a "hidden" input
  var aux = document.createElement("input");
  // Assign it the value of the specified element
  aux.setAttribute("value", "Você não pode mais dar printscreen. Isto faz parte da nova medida de segurança do sistema.");
  // Append it to the body
  document.body.appendChild(aux);
  // Highlight its content
  aux.select();
  // Copy the highlighted text
  document.execCommand("copy");
  // Remove it from the body
  document.body.removeChild(aux);
  alert("Print screen desabilitado.");
}

$(window).keyup(function(e){
  if(e.keyCode == 44){
    copyToClipboard();
  }
});

$(window).focus(function() {
  $("body").show();
}).blur(function() {
  $("body").hide();
});
