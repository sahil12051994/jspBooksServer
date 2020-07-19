var data = {
  "particles": {
    "number": {
      "value": 166,
      "density": {
        "enable": true,
        "value_area": 631.3181133058181
      }
    },
    "color": {
      "value": "#d2c7c7"
    },
    "shape": {
      "type": "circle",
      "stroke": {
        "width": 0,
        "color": "#000000"
      },
      "polygon": {
        "nb_sides": 5
      },
      "image": {
        "src": "img/github.svg",
        "width": 100,
        "height": 100
      }
    },
    "opacity": {
      "value": 0.5,
      "random": false,
      "anim": {
        "enable": false,
        "speed": 1,
        "opacity_min": 0.1,
        "sync": false
      }
    },
    "size": {
      "value": 3,
      "random": true,
      "anim": {
        "enable": false,
        "speed": 40,
        "size_min": 0.1,
        "sync": false
      }
    },
    "line_linked": {
      "enable": true,
      "distance": 150,
      "color": "#b6afaf",
      "opacity": 0.4,
      "width": 1
    },
    "move": {
      "enable": true,
      "speed": 2,
      "direction": "none",
      "random": true,
      "straight": false,
      "out_mode": "bounce",
      "bounce": false,
      "attract": {
        "enable": false,
        "rotateX": 600,
        "rotateY": 1200
      }
    }
  },
  "interactivity": {
    "detect_on": "canvas",
    "events": {
      "onhover": {
        "enable": false,
        "mode": "repulse"
      },
      "onclick": {
        "enable": true,
        "mode": "repulse"
      },
      "resize": true
    },
    "modes": {
      "grab": {
        "distance": 400,
        "line_linked": {
          "opacity": 1
        }
      },
      "bubble": {
        "distance": 400,
        "size": 40,
        "duration": 2,
        "opacity": 8,
        "speed": 3
      },
      "repulse": {
        "distance": 200,
        "duration": 0.4
      },
      "push": {
        "particles_nb": 4
      },
      "remove": {
        "particles_nb": 2
      }
    }
  },
  "retina_detect": true
}

var serviceUrl;


// load works on safari
$(window).on('load', function() {
  var url = document.URL;
  var arr = url.split('/');
  serviceUrl = arr[0] + '//' + arr[2] + '/';
  particlesJS("particles-js", data);
});

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

toastr.options = {
  "closeButton": true,
  "debug": false,
  "newestOnTop": false,
  "progressBar": false,
  "positionClass": "toast-top-right",
  "preventDuplicates": true,
  "onclick": null,
  "showDuration": "300",
  "hideDuration": "1000",
  "timeOut": "5000",
  "extendedTimeOut": "1000",
  "showEasing": "swing",
  "hideEasing": "linear",
  "showMethod": "fadeIn",
  "hideMethod": "fadeOut"
}

$(document).on('click', "#login_button", function() {
  // serviceUrl = getServiceURL();
  // alert(serviceUrl)
  // var emailRegex = /^[A-Za-z0-9._+-]*\@[A-Za-z0-9_+-]*\.[A-Za-z]{2,5}$/;
  // var email = $("#login_email").val();
  signin.email = $("#login_email").val();
  signin.password = $("#login_password").val();
  $.ajax({
    url: serviceUrl + "face/login",
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
    url: serviceUrl + "face/signup",
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
