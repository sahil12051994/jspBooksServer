// var serviceUrl = getServiceURL();
// var authToken = "bearer " + $.cookie('jbm');

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

  var clicked = false, clickY;
  $(document).on({
      'mousemove': function(e) {
          clicked && updateScrollPos(e);
      },
      'mousedown': function(e) {
          clicked = true;
          clickY = e.pageY;
      },
      'mouseup': function() {
          clicked = false;
          $('html').css('cursor', 'auto');
      }
  });

  var updateScrollPos = function(e) {
      $('html').css('cursor', 'row-resize');
      $(window).scrollTop($(window).scrollTop() + (clickY - e.pageY));
  }

});
