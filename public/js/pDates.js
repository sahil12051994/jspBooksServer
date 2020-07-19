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

function getdateISOString(n){
  let t = new Date((new Date()).getTime()+86400000*n);
  t = getIndianTimeISOString(t,5.5);
  t = getMidNightTime(t);
  return t;
}

function getMidNightTime(isoT){
  isoT = isoT.split("T")[0] +"T00:00:00.000Z";
  return isoT;
}

function getHoursMinutesString(isoT){
  let t = (isoT.split("T")[1]).split(":");
  t = t[0] + ":" + t[1];
  return t;
}

function hhmmToISOstr(date,hhmm){
    let time = date.split('T')[0] + 'T' + hhmm + ':00.000Z'
    return time;
}
