var serviceUrl;

// load works on safari
$(window).on('load', function() {
  var url = document.URL;
  var arr = url.split('/');
  serviceUrl = arr[0] + '//' + arr[2] + '/';
  // particlesJS("particles-js", data);
  $('.signupElement').addClass("hidden")
});

$(document).on('click','#loginViewButton',function() {
  $('.signupElement').addClass("hidden")
  $('.loginElement').removeClass("hidden")
})

$(document).on('click','#registerNewButton',function() {
  $('.loginElement').addClass("hidden")
  $('.signupElement').removeClass("hidden")
})

var signin = {
  email: "",
  password: ""
};

var signUp = {
  profile: {
    name: "",
    gender: "M"
  },
  email: "",
  password: "",
  employment: {
    designation: "employee",
    type: "NMPL"
  }
};

$(document).on('click', "#login_button", function() {
  // serviceUrl = getServiceURL();
  // alert(serviceUrl)
  // var emailRegex = /^[A-Za-z0-9._+-]*\@[A-Za-z0-9_+-]*\.[A-Za-z]{2,5}$/;
  // var email = $("#login_email").val();
  signin.email = $("#login_email").val();
  signin.password = $("#login_password").val();
  $.ajax({
    url: serviceUrl + "jsp/login",
    type: "POST",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    data: JSON.stringify(signin),
    processData: false,
    success: function(res, output, xhr) {
      console.log(res)
      // alert(res)
      if (res.redirect) {
        window.location.href = serviceUrl + res.redirect
      }
      if (res.error) {
        toastr["error"](res.error_text)
      }
    },

    error: function(err) {
      alert(JSON.stringify(err))
      toastr["error"]("Login Failed")
    }
  }).done(function(data) {

  });
  return false;
});

$(document).on('click', "#signup_button", function() {
  var emailRegex = /^[A-Za-z0-9._+-]*\@[A-Za-z0-9_+-]*\.[A-Za-z]{2,5}$/;
  var email = $("#signup_email").val();
  var password = $("#signup_password").val();
  var confirmPassword = $("#signup_confirm_password").val();

  if ($("#signup_username").val() == "") {
    $("#signup_username").focus();
    $("#signup_username").css('border', 'solid 2px red');
    return false;
  }
  if ($("#signup_email").val() == "") {
    $("#signup_email").focus();
    $("#signup_email").css('border', 'solid 2px red');
    return false;
  }
  if (!emailRegex.test(email)) {
    $("#signup_email").focus();
    $("#signup_email").css('border', 'solid 2px red');
    toastr["error"]("Please enter valid email")
    return false;
  }
  if ($("#signup_password").val() == "") {
    $("#signup_password").focus();
    $("#signup_password").css('border', 'solid 2px red');
    toastr["error"]("Password blank")
    return false;
  }
  if ($("#signup_confirm_password").val() == "") {
    $("#signup_confirm_password").focus();
    $("#signup_confirm_password").css('border', 'solid 2px red');
    toastr["error"]("Please enter valid email")
    return false;
  }
  if (password != confirmPassword) {
    $("#signup_confirm_password").focus();
    $("#signup_confirm_password").css('border', 'solid 2px red');
    return false;
  }


  signUp.profile.name = $("#signup_username").val();
  // signUp.name.last = $("#lastName").val();
  signUp.email = $("#signup_email").val();
  signUp.password = $("#signup_password").val();
  $.ajax({
    url: serviceUrl + "jsp/signup",
    type: "POST",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    data: JSON.stringify(signUp),
    processData: false,
    success: function(res) {
      if (res.error_text) {
        toastr["error"](res.error_text)
      } else {
        toastr["success"]("Account successfully created")
      }
      if (res.redirect) {
        window.location.href = serviceUrl + res.redirect
      }
    },
    error: function(err) {
      toastr["error"]("Account not created")
    }
  }).done(function(data) {

  });
  return false;
});
