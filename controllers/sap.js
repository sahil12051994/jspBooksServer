const request = require('request');
const NodeCache = require("node-cache");
const aiServerCache = new NodeCache();


exports.getEmpInfoSAP  = (req, res) => {
  if(req.user){
    return getEmpInfo(req.query.empID).then(function(emp) {
        res.send(emp)
    })
  }else{
    return getEmpInfo(req.query.empID).then(function(emp) {
        res.send(emp)
    })
    res.json({
      message:"Unautharized access",
      code:0
    });
  }

}

function getEmpInfo(empID) {
	let cacheKey = "getEmpInfo" + empID;
	let value = aiServerCache.get(cacheKey);

	if (value == undefined || clearCache == 'true') {

		return new Promise(function(resolve, reject) {

			setTimeout(function() {
				reject({
					error: 'timeout',
					message: 'SAP server taking too long.'
				});
				return;
			}, 3 * 60 * 1000);


			request({
				url: 'http://223.30.161.218:50000/RESTAdapter/mob/EMPDETAIL',
				method: "POST",
				headers: {
					"content-type": 'text/xml',
				},
				body: `<?xml version="1.0" encoding="UTF-8"?>
                        <ns0:MT_EMPDETAIL_SND xmlns:ns0="http://emp_detail">
                        <P_PERNR>${empID}</P_PERNR>
                        </ns0:MT_EMPDETAIL_SND>`,
				json: false
			}, function(err, httpResponse, body) {
				if (err) {
					console.log("SAP server Error");
					reject("SAP Server Error");
					return;
				};
				aiServerCache.set(cacheKey, body, 36000);
				resolve(body);
			}).auth('PISUPERAI', 'Jbm#1234', false);
		})
	} else {
		console.log("cache has it getEmpInfo");
		let p = new Promise(function(resolve, reject) {
			resolve()
		})
		return p.then(function() {
			return value;
		});
	}
}

module.exports.getEmpInfo = getEmpInfo;
