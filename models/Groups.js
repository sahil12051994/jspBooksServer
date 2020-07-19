const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  groupType: {
    type: String,
    required: true
  },
  groupName: {
    type: String,
    required: true,
    unique: true
  },
  groupMembers: [{
    type: String
  }],
  groupPermissions: [{
    type: String
  }],
  companyId: {
    type: String
  },
  groupIdentifier: {
    typeOf: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true,
    }
  }
}, {
  collection: 'groups'
});

const Group = mongoose.model('groups', GroupSchema);

module.exports = Group;

// db.groups.insert({
//   groupType: "accessControl",
//   groupName: "NAMPL_PantNagar",
//   groupMembers: ["camera_192158144_N-1"],
//   groupIdentifier: {
//     typeOf: "plant",
//     value: "N-1"
//   },
//   companyId: "JBMGroup"
// })

/*
{
        "groupType": "accessControl",
        "groupName": "1022_Zone2",
        "groupMembers": [
            "camera_192158144_N-1",
            "camera_192158144_N-2",
            "camera_192158144_N-3"
        ],
        "groupIdentifier": {
            "typeOf": "plant",
            "value": "J-2"
        },
        "companyId": "JBMGroup"
    }
*/
