$(window).on('load', async function() {
  let getUploadedBooksVal = await getUploadedBooks();
});

async function insertBookFunction() {

  let bookObject = {
    bookDetails: {
      bookId: $("#bookId").val(),
      bookAuthor: $("#bookAuthor").val(),
      bookTags: $("#bookTags").val().split(","),
      bookPrice: parseFloat($("#bookPrice").val()),
      bookDescription: $("#bookDescription").val(),
      bookName: $("#bookName").val(),
      bookType: $("#bookType").val(),
      instituteType: $("input[name='optionsRadios']:checked").val(),
      bookPages: [{
        pageNumber: 1,
        pageImagePath: "/uploads/books/"+$("#bookType").val()+"/1.png",
        pageText: "",
        pageTags: ["maths", "algebra"]
      },{
        pageNumber: 2,
        pageImagePath: "/uploads/books/"+$("#bookType").val()+"/2.png",
        pageText: "",
        pageTags: ["maths", "algebra"]
      }]
    },
  }
  console.log(bookObject)
  $.ajax({
    url: serviceUrl + "jsp/book/upload",
    type: "POST",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    crossDomain: true,
    data: JSON.stringify(bookObject),
    beforeSend: function(request) {
      request.setRequestHeader('Authorization', authToken);
      request.setRequestHeader("Access-Control-Allow-Origin", "*");
    },
    success: async function(res) {
      getUploadedBooks()
    },
    error: function(err) {}
  });
}

function fillUploadedBooksList(res) {
  $('#uploadedBooksList').html('');
  let tempHtml = '';
  for (var i = 0; i < res.length; i++) {
    tempHtml = tempHtml + '<div class="callout callout-success">\
                      <h5>'+res[i]['bookName']+',  <small>'+res[i]['bookType']+'</small></h5>\
                      <p>'+res[i]['bookId']+',  '+text_truncate(res[i]['bookDescription'],200)+'</p>\
                    </div>'
  }
  $('#uploadedBooksList').html(tempHtml);
}

$(document).on('click', '#insertBook', function() {
  insertBookFunction();
})

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

function uploadPdf(bookData) {
  return new Promise(function(resolve, reject) {
    var form = $('#uploadForm')[0];
    var data = new FormData(form);
    let file = $('#selectFilePlm')[0].files;
    console.log(data)
    $.ajax({
      url: serviceUrl + 'jsp/book/uploadPdf?' + 'bookType=' + bookData.bookType + '&bookId=' + bookData.bookId + '&fName=' + bookData.fName,
      type: 'POST',
      data: data,
      async: false,
      cache: false,
      contentType: false,
      processData: false,
      success: function(res) {
        resolve()
      },
      error: function() {
      }
    });
  })
}

function convertBook(bookData) {
  return new Promise(function(resolve, reject) {
    $.ajax({
      url: serviceUrl + 'jsp/book/convertBook?' + 'bookType=' + bookData.bookType + '&bookId=' + bookData.bookId + '&fName=' + bookData.fName,
      type: 'GET',
      async: false,
      cache: false,
      contentType: false,
      processData: false,
      success: function(res) {
        console.log(res)
      },
      error: function() {
      }
    });
  })
}

$("#uploadPdfButton").click(async function(event) {
  //disable the default form submission
  event.preventDefault();
  let uploadStatus = await uploadPdf({
    bookType: $("#bookType").val(),
    bookId: $("#bookId").val(),
    fName: $('#selectFilePlm')[0].files[0]['name']
  })
  return false;
});

$(document).on('click', "#convertBook", async function() {
  let uploadStatus = await convertBook({
    bookType: $("#bookType").val(),
    bookId: $("#bookId").val(),
    fName: $('#selectFilePlm')[0].files[0]['name']
  })
})
