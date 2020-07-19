function getServiceURL() {
  var url = document.URL;
  var arr = url.split('/');
  url = arr[0] + '//' + arr[2] + '/';
  // alert(url)
  return url;
}

function updateQueryStringParameter(uri, key, value) {
  var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
  var separator = uri.indexOf('?') !== -1 ? "&" : "?";
  if (uri.match(re)) {
    return uri.replace(re, '$1' + key + "=" + value + '$2');
  } else {
    return uri + separator + key + "=" + value;
  }
}

$(document).on('click', '.hashesUrl', function(e) {
  e.preventDefault();
});

$(document).on('click', "#logout_button", function() {

  $.ajax({
    url: serviceUrl + "face/logout",
    type: "GET",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    processData: false,
    success: function(res, output, xhr) {
      if (res.redirect) {
        // console.log("logout")
        window.location.href = serviceUrl + res.redirect
      }
    },
    error: function(err) {
      toastr["error"]("Logout Failed")
    }
  }).done(function(data) {

  });
  return false;
});

var serviceUrl = getServiceURL();
var authToken = "bearer " + $.cookie('jbm');

var getUrlParameter = function getUrlParameter(sParam) {
  var sPageURL = window.location.search.substring(1),
    sURLVariables = sPageURL.split('&'),
    sParameterName,
    i;

  for (i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split('=');

    if (sParameterName[0] === sParam) {
      return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
    }
  }
};

var echartGauge;
var selected_camID = "";
var planned_manpower_for_calender = {};
var processed_manpower_for_calender;
var global_all_cameras = {
  all_cameras: [],
  inactive: []
};
var currentUser;
var allCamInfo;
var global_planned_manpower;
var commonFrameLink = getServiceURL()

function checkCommonPermissions() {

}

async function groupsList(data) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: serviceUrl + "face/groups/getinfo?companyId=" + data.companyId + "&type=" + data.type,
      type: "GET",
      contentType: "application/json; charset=utf-8",
      crossDomain: true,
      processData: false,
      success: function(res, output, xhr) {
        resolve(res)
      },
      error: function(err) {
        toastr["error"]("Logout Failed")
      }
    })
  })
}

function makeSideMenuActive(className) {
  let sideMenu = $('#sideMenuList');
  sideMenu.find('.menuItem').removeClass('current-page');
  sideMenu.find('.menuItem.' + className).addClass('current-page');
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

function getIndianTimeISOStringVerified(date) {
  return date.add(5, 'hours').add(30, 'minutes').toISOString()
}

function getdateISOString(n) {
  let t = new Date((new Date()).getTime() + 86400000 * n);
  t = getIndianTimeISOString(t, 5.5);
  t = getMidNightTime(t);
  return t;
}

function getMidNightTime(isoT) {
  isoT = isoT.split("T")[0] + "T00:00:00.000Z";
  return isoT;
}

function getHoursMinutesString(isoT) {
  let t = (isoT.split("T")[1]).split(":");
  t = t[0] + ":" + t[1];
  return t;
}

function getIndianTimeISOString(d, offset = 5.5) {
  //var d = new Date();
  var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  var nd = new Date(utc + (3600000 * offset));
  let year = (nd.getFullYear() < 10) ? "0" + nd.getFullYear() : "" + nd.getFullYear();
  let month = ((nd.getMonth() + 1) < 10) ? "0" + (nd.getMonth() + 1) : "" + (nd.getMonth() + 1);
  let day = (nd.getDate() < 10) ? "0" + nd.getDate() : "" + nd.getDate();
  let hours = (nd.getHours() < 10) ? "0" + nd.getHours() : "" + nd.getHours();
  let minutes = (nd.getMinutes() < 10) ? "0" + nd.getMinutes() : "" + nd.getMinutes();
  let seconds = (nd.getSeconds() < 10) ? "0" + nd.getSeconds() : "" + nd.getSeconds();
  let isoString = year + '-' + month + '-' + day + 'T' + hours + ':' + minutes + ':' + seconds + '.000Z';
  return isoString;
}

function round(value, precision) {
  var multiplier = Math.pow(10, precision || 0);
  return Math.round(value * multiplier) / multiplier;
}

/* DATERANGEPICKER */

function init_daterangepicker() {

  if (typeof($.fn.daterangepicker) === 'undefined') {
    return;
  }
  console.log('init_daterangepicker');

  var cb = function(start, end, label) {
    console.log(start.toISOString(), end.toISOString(), label);
    $('#reportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
  };

  var optionSet1 = {
    startDate: moment().subtract(1, 'days'),
    endDate: moment().subtract(0, 'days'),
    minDate: '01/01/2019',
    maxDate: '12/31/2019',
    dateLimit: {
      days: 1
    },
    showDropdowns: true,
    showWeekNumbers: true,
    timePicker: false,
    timePickerIncrement: 1,
    timePicker12Hour: true,
    ranges: {
      'Today': [moment(), moment()],
      'Yesterday': [moment().subtract(1, 'days'), moment().subtract(2, 'days')],
      'Last 7 Days': [moment().subtract(6, 'days'), moment()],
      'Last 30 Days': [moment().subtract(29, 'days'), moment()],
      'This Month': [moment().startOf('month'), moment().endOf('month')],
      'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
    },
    opens: 'left',
    buttonClasses: ['btn btn-default'],
    applyClass: 'btn-small btn-primary',
    cancelClass: 'btn-small',
    format: 'MM/DD/YYYY',
    separator: ' to ',
    locale: {
      applyLabel: 'Submit',
      cancelLabel: 'Clear',
      fromLabel: 'From',
      toLabel: 'To',
      customRangeLabel: 'Custom',
      daysOfWeek: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
      monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      firstDay: 1
    }
  };

  $('#reportrange span').html(moment().subtract(29, 'days').format('MMMM D, YYYY') + ' - ' + moment().format('MMMM D, YYYY'));
  $('#reportrange').daterangepicker(optionSet1, cb);
  $('#reportrange').on('show.daterangepicker', function() {
    console.log("show event fired");
  });
  $('#reportrange').on('hide.daterangepicker', function() {
    console.log("hide event fired");
  });

  $('#reportrange').on('apply.daterangepicker', function(ev, picker) {
    let start_date_for_ajax = picker.startDate.toISOString();
    start_date_for_ajax = getMidNightTime(start_date_for_ajax);
    start_date_for_ajax = new Date((new Date(start_date_for_ajax)).getTime() + 86400000);
    start_date_for_ajax = getIndianTimeISOString(start_date_for_ajax, 5.5);
    start_date_for_ajax = getMidNightTime(start_date_for_ajax);


    let end_date_for_ajax = picker.endDate.toISOString();
    end_date_for_ajax = getMidNightTime(end_date_for_ajax);
    end_date_for_ajax = new Date((new Date(end_date_for_ajax)).getTime() + 86400000);
    end_date_for_ajax = getIndianTimeISOString(end_date_for_ajax, 5.5);
    end_date_for_ajax = getMidNightTime(end_date_for_ajax);

    //updateSpanEfficiency(selected_camID, start_date_for_ajax, end_date_for_ajax);
    //plotHistoricalCharts(selected_camID, start_date_for_ajax, end_date_for_ajax);
    //getUsefulMetrics(start_date_for_ajax);
  });

  $('#reportrange').on('cancel.daterangepicker', function(ev, picker) {
    console.log("cancel event fired");
  });
  $('#options1').click(function() {
    $('#reportrange').data('daterangepicker').setOptions(optionSet1, cb);
  });
  $('#options2').click(function() {
    $('#reportrange').data('daterangepicker').setOptions(optionSet2, cb);
  });
  $('#destroy').click(function() {
    $('#reportrange').data('daterangepicker').remove();
  });

}

function init_daterangepicker_right() {

  if (typeof($.fn.daterangepicker) === 'undefined') {
    return;
  }
  console.log('init_daterangepicker_right');

  var cb = function(start, end, label) {
    console.log(start.toISOString(), end.toISOString(), label);
    $('#reportrange_right span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
  };

  var optionSet1 = {
    startDate: moment().subtract(29, 'days'),
    endDate: moment(),
    minDate: '01/01/2012',
    maxDate: '12/31/2020',
    dateLimit: {
      days: 60
    },
    showDropdowns: true,
    showWeekNumbers: true,
    timePicker: false,
    timePickerIncrement: 1,
    timePicker12Hour: true,
    ranges: {
      'Today': [moment(), moment()],
      'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
      'Last 7 Days': [moment().subtract(6, 'days'), moment()],
      'Last 30 Days': [moment().subtract(29, 'days'), moment()],
      'This Month': [moment().startOf('month'), moment().endOf('month')],
      'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
    },
    opens: 'right',
    buttonClasses: ['btn btn-default'],
    applyClass: 'btn-small btn-primary',
    cancelClass: 'btn-small',
    format: 'MM/DD/YYYY',
    separator: ' to ',
    locale: {
      applyLabel: 'Submit',
      cancelLabel: 'Clear',
      fromLabel: 'From',
      toLabel: 'To',
      customRangeLabel: 'Custom',
      daysOfWeek: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
      monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      firstDay: 1
    }
  };

  $('#reportrange_right span').html(moment().subtract(29, 'days').format('MMMM D, YYYY') + ' - ' + moment().format('MMMM D, YYYY'));

  $('#reportrange_right').daterangepicker(optionSet1, cb);

  $('#reportrange_right').on('show.daterangepicker', function() {
    console.log("show event fired");
  });
  $('#reportrange_right').on('hide.daterangepicker', function() {
    console.log("hide event fired");
  });
  $('#reportrange_right').on('apply.daterangepicker', function(ev, picker) {
    console.log("yyyyyyyyyyyyyyyyyyyyy " + picker.startDate.toISOString() + " to " + picker.endDate.toISOString());
  });
  $('#reportrange_right').on('cancel.daterangepicker', function(ev, picker) {
    console.log("cancel event fired");
  });

  $('#options1').click(function() {
    $('#reportrange_right').data('daterangepicker').setOptions(optionSet1, cb);
  });

  $('#options2').click(function() {
    $('#reportrange_right').data('daterangepicker').setOptions(optionSet2, cb);
  });

  $('#destroy').click(function() {
    $('#reportrange_right').data('daterangepicker').remove();
  });

}

function init_daterangepicker_single_call() {

  if (typeof($.fn.daterangepicker) === 'undefined') {
    return;
  }
  console.log('init_daterangepicker_single_call');

  $('#single_cal1').daterangepicker({
    singleDatePicker: true,
    singleClasses: "picker_1"
  }, function(start, end, label) {
    console.log(start.toISOString(), end.toISOString(), label);
  });
  $('#single_cal2').daterangepicker({
    singleDatePicker: true,
    singleClasses: "picker_2"
  }, function(start, end, label) {
    console.log(start.toISOString(), end.toISOString(), label);
  });
  $('#single_cal3').daterangepicker({
    singleDatePicker: true,
    singleClasses: "picker_3"
  }, function(start, end, label) {
    console.log(start.toISOString(), end.toISOString(), label);
  });
  $('#single_cal4').daterangepicker({
    singleDatePicker: true,
    singleClasses: "picker_4"
  }, function(start, end, label) {
    console.log(start.toISOString(), end.toISOString(), label);
  });


}


function init_daterangepicker_reservation() {

  if (typeof($.fn.daterangepicker) === 'undefined') {
    return;
  }
  console.log('init_daterangepicker_reservation');

  $('#reservation').daterangepicker(null, function(start, end, label) {
    console.log(start.toISOString(), end.toISOString(), label);
  });

  $('#reservation-time').daterangepicker({
    timePicker: true,
    timePickerIncrement: 30,
    locale: {
      format: 'MM/DD/YYYY h:mm A'
    }
  });

}
