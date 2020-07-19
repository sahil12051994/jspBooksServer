var canvas, context, canvaso, contexto, count = 0,
  flag = false;
var cordinate = [];

var selectedCamId;

$(document).on('change', '#cameraMaskingSelectTag', function() {
  erase();
})

if (window.addEventListener) {
  window.addEventListener('load', function() {

    // The active tool instance.
    var tool;
    var tool_default = 'line';

    var img = new Image();
    img.onload = function() {
      alert(this.width + 'x' + this.height);
    }
    img.src = serviceUrl + 'face/getframe?camId=' + $('#cameraMaskingSelectTag').val() + '&random=1';

    function init() {
      // Find the canvas element.
      canvaso = document.getElementById('imageView');
      if (!canvaso) {
        alert('Error: I cannot find the canvas element!');
        return;
      }

      if (!canvaso.getContext) {
        alert('Error: no canvas.getContext!');
        return;
      }

      // Get the 2D canvas context.
      contexto = canvaso.getContext('2d');
      if (!contexto) {
        alert('Error: failed to getContext!');
        return;
      }

      // Add the temporary canvas.
      var container = canvaso.parentNode;
      canvas = document.createElement('canvas');
      if (!canvas) {
        alert('Error: I cannot create a new canvas element!');
        return;
      }


      canvas.id = 'imageTemp';
      canvas.width = canvaso.width;
      canvas.height = canvaso.height;
      container.appendChild(canvas);

      context = canvas.getContext('2d');

      // Get the tool select input.
      var tool_select = document.getElementById('dtool');
      if (!tool_select) {
        alert('Error: failed to get the dtool element!');
        return;
      }

      tool_select.addEventListener('change', ev_tool_change, false);

      // Activate the default tool.
      if (tools[tool_default]) {
        tool = new tools[tool_default]();
        tool_select.value = tool_default;
      }

      // Attach the mousedown, mousemove and mouseup event listeners.
      canvas.addEventListener('mousedown', ev_canvas, false);
      canvas.addEventListener('mousemove', ev_canvas, false);
      canvas.addEventListener('mouseup', ev_canvas, false);
    }

    // The general-purpose event handler. This function determines the mouse position relative to the canvas element.
    function ev_canvas(ev) {
      if (ev.layerX || ev.layerX == 0) { // Firefox
        ev._x = ev.layerX;
        //console.log(typeof ev._x);
        ev._y = ev.layerY;
      } else if (ev.offsetX || ev.offsetX == 0) { // Opera
        ev._x = ev.offsetX;
        ev._y = ev.offsetY;
      }

      // Call the event handler of the tool.
      var func = tool[ev.type];
      if (func) {
        func(ev);
      }
    }

    // The event handler for any changes made to the tool selector.
    function ev_tool_change(ev) {
      if (tools[this.value]) {
        tool = new tools[this.value]();
      }
    }

    // This function draws the #imageTemp canvas on top of #imageView, after which #imageTemp is cleared. This function is called
    //each time when the user completes a drawing operation.
    function img_update() {
      contexto.drawImage(canvas, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
    }

    // This object holds the implementation of each drawing tool.
    var tools = {};

    // The line tool.
    tools.line = function() {
      var tool = this;
      this.started = false;

      this.mousedown = function(ev) {
        tool.started = true;
        tool.x0 = ev._x;
        tool.y0 = ev._y;
        console.log("hi");

        if (flag == false) {
          cordinate.push([tool.x0, tool.y0]);
          flag = true;
          count++;
        }

      };

      this.mousemove = function(ev) {
        if (!tool.started) {
          return;
        }

        context.clearRect(0, 0, canvas.width, canvas.height);

        context.beginPath();
        context.moveTo(tool.x0, tool.y0);
        context.lineTo(ev._x, ev._y);
        context.stroke();
        context.closePath();

      };

      this.mouseup = function(ev) {
        if (tool.started) {

          cordinate.push([ev._x, ev._y]);
          count++;

          tool.mousemove(ev);
          tool.started = false;
          img_update();
          console.log(cordinate);
        }
      };
    };

    init();

  }, false);
}

function erase() {

  swal({
      title: "Want to clear the masks ?",
      text: "Current opened mask will be erased",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    })
    .then((willDelete) => {
      if (willDelete) {
        document.getElementById("camBackground").src = serviceUrl + 'face/getframe?camId=' + $('#cameraMaskingSelectTag').val() + '&random=1';
        contexto.clearRect(0, 0, canvas.width, canvas.height);
        document.getElementById("canvasimg").style.display = "none";
      } else {
        return;
      }
    });

  // var m = confirm("Want to clear the masks ?");
  //
  // if (m) {
  //     contexto.clearRect(0, 0, canvas.width, canvas.height);
  //     document.getElementById("canvasimg").style.display = "none";
  // }

}

function seeMask() {
  document.getElementById("canvasimg").style.border = "2px solid";
  //document.getElementById("canvasimg").style.background = "black";
  var dataURL = canvaso.toDataURL('image/jpeg', 1.0);
  document.getElementById("canvasimg").src = dataURL;
  document.getElementById("canvasimg").style.display = "inline";
}

function save() {
  var dataURL = canvaso.toDataURL('image/jpeg', 1.0);
  let dataToSend = {}
  dataToSend['base64Img'] = dataURL;
  dataToSend['camId'] = $('#cameraMaskingSelectTag').val();
  seeMask();
  $.ajax({
    url: serviceUrl + "face/mask/",
    type: "POST",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    crossDomain: true,
    data: JSON.stringify(dataToSend),
    beforeSend: function(request) {
      request.setRequestHeader('Authorization', authToken);
      request.setRequestHeader("Access-Control-Allow-Origin", "*");
    },
    success: function(res) {
      if (res.status) {
        if (res.status == 1) {
          toastr["success"]("Added successfully")
        }
      }
    },
    error: function(err) {
      toastr["error"]("Adding Failed")
    }
  });
}

function clip() {

  contexto.beginPath();
  contexto.moveTo(cordinate[0][0], cordinate[0][1]);

  for (let i = 1; i < count; i++)
    contexto.lineTo(cordinate[i][0], cordinate[i][1]);

  contexto.closePath();
  contexto.fillStyle = "white"
  contexto.fill();

  flag = false;
  for (let i = count - 1; i >= 0; i--)
    cordinate.pop();

  count = 0;
  seeMask()

}
