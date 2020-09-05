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
    success: async function(res) {
      $(".user_name").html(res.profile.name);
      $.cookie("uId", res._id)
      if(res.profile.name != "RISHABH VIJ") {
        $('.permissionCheck').remove()
      }

      if(res.permission) {
        if(res.permission.grantAccessToAllBooks) {
          let getUploadedBooksVal = await getUploadedBooks();
        }
      }

    },
    error: function(err) {}
  });

});

var imagesArray = [];
var globalCounter = 0;

function showImagesLogicNext() {
  for (var i = globalCounter; i < globalCounter+5; i++) {
    console.log(globalCounter, i)
    $('#pageCount'+(i+1)).attr('src',"/jsp/uploads" + imagesArray[i]['path'])
    globalCounter++;
  }
}

function showImagesLogicPrev() {
  for (var i = globalCounter; i > globalCounter-5; i--) {
    $('#pageCount'+(i+1)).attr('src',"/jsp/uploads" + imagesArray[i]['path'])
    globalCounter--;
  }
}

function showImages(res) {
  imagesArray = res['files']
  imagesArray.sort(function(a, b) {
    var keyA = (a.number),
      keyB = (b.number);
    // Compare the 2 dates
    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    return 0;
  });
  let tempHtml = '';
  // $("#bookDiv").html('');
  showImagesLogicNext();
  // console.log(tempHtml)
  // $("#bookDiv").html(tempHtml);
}

$(document).on('click', '#prevButton', function() {
  showImagesLogicPrev()
})

$(document).on('click', '#nextButton', function() {
  showImagesLogicNext()
})

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

// $(document).bind("contextmenu", function(e) {
//   return false;
// });
//
// function copyToClipboard() {
//   // Create a "hidden" input
//   var aux = document.createElement("input");
//   // Assign it the value of the specified element
//   aux.setAttribute("value", "Você não pode mais dar printscreen. Isto faz parte da nova medida de segurança do sistema.");
//   // Append it to the body
//   document.body.appendChild(aux);
//   // Highlight its content
//   aux.select();
//   // Copy the highlighted text
//   document.execCommand("copy");
//   // Remove it from the body
//   document.body.removeChild(aux);
//   alert("Can not print screen.");
// }
//
// $(window).keyup(function(e){
//   if(e.keyCode == 44){
//     copyToClipboard();
//   }
// });
//
// $(window).focus(function() {
//   $("body").show();
// }).blur(function() {
//   $("body").hide();
// });

// var previousOrientation = window.orientation;
// var checkOrientation = function(){
//     if(window.orientation !== previousOrientation){
//         previousOrientation = window.orientation;
//         alert("changed")
//         // orientation changed, do your magic here
//     }
// };
//
// window.addEventListener("resize", checkOrientation, false);
// window.addEventListener("orientationchange", checkOrientation, false);
//
// // (optional) Android doesn't always fire orientationChange on 180 degree turns
// setInterval(checkOrientation, 2000);
