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
  mobile: "",
  institute: "",
  instituteType: "",
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
        $.cookie("uId", res._id)
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

function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function validateMobile(mobile) {
    const re = /^(\+\d{1,3}[- ]?)?\d{10}$/;
    return re.test(String(mobile));
}

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
  console.log(email, validateEmail(email))
  if (!validateEmail(email)) {
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

  if($("#signup_mobile").val() == "") {
    $("#signup_mobile").focus();
    $("#signup_mobile").css('border', 'solid 2px red');
    toastr["error"]("Mobile-Field blank")
    return false;
  }

  if(!validateMobile($("#signup_mobile").val())) {
    $("#signup_mobile").focus();
    $("#signup_mobile").css('border', 'solid 2px red');
    toastr["error"]("Mobile-Field blank")
    return false;
  }


  signUp.profile.name = $("#signup_username").val();
  // signUp.name.last = $("#lastName").val();
  signUp.email = $("#signup_email").val();
  signUp.password = $("#signup_password").val();
  signUp.mobile = $("#signup_mobile").val();
  signUp.institute = $("#signup_institute").val();
  signUp.instituteType = $("input[name='optionsRadios']:checked").val();
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
        $.cookie("uId", res._id)
      }
    },
    error: function(err) {
      toastr["error"]("Account not created")
    }
  }).done(function(data) {

  });
  return false;
});
