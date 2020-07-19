import pymongo
import yaml
from bson.son import SON
global db
import re

def connectDB(dbObject):
    global db
    try:
        print("MongoDB Connection Started")
        client = pymongo.MongoClient(dbObject['mongodb']['address'], dbObject['mongodb']['port'],username= dbObject['mongodb']['username'],password= dbObject['mongodb']['password'],authSource='admin',authMechanism='SCRAM-SHA-1')
        db = client[dbObject['mongodb']['dbName']]
        print("MongoDB Connection successfull")
    except:
        print("DB Connection error occurred")

#importing server config file for camera configurations
try:
    with open("/home/hercules/aiProject/dashboard/JBM_Dashboard/config/server.yml", 'r') as ymlfile:
        cfg_server = yaml.load(ymlfile)
    connectDB(cfg_server['database'])
except IOError:
    print("Server Config file does not appear to exist.")

cameras = db.cameras

import pprint
##############################################################################################################################################################################################
##############################################################################################################################################################################################
##############################################################################################################################################################################################
##############################################################################################################################################################################################
##############################################################################################################################################################################################
# # Query to change camera names in already existing camera documents froms
# # (camera_ + number bw 0-255) ==> (camera_ + number bw 0-255 + plant Name) ==>current query==> (camera_ + IP Addr without space + plant Name)
# pipeline = [
#     # {
#     #     "$match" : {
#     #         "plant" : "N-1"
#     #         }
#     # },
#     {
#         "$project" : {
#             "camName" : {
#                 "$concat" : [
#                     "camera_",
#                     {
#                         "$reduce" : {
#                             "input" :{
#                                 "$split": ["$hardware.ip","."]
#                             },
#                             "initialValue": "",
#                             "in" : {
#                                 "$concat" : ["$$value","$$this"]
#                             }
#                         }
#                     },
#                     "_",
#                     "$plant"
#                 ]
#             }
#         }
#     }
# ]
#
# pprint.pprint(list(db.cameras.aggregate(pipeline)))
#
# camerasOut = list(db.cameras.aggregate(pipeline))
#
# for camera in camerasOut:
#     db.cameras.update({"_id" : camera["_id"]}, {"$set" : {"camName" : camera["camName"]}})
#     # print(camera["_id"], camera["camName"])
##############################################################################################################################################################################################
##############################################################################################################################################################################################
##############################################################################################################################################################################################
##############################################################################################################################################################################################
##############################################################################################################################################################################################
cam_array = [
("camera_19211079_N-5","camera_79","camera_79","camera_79_N-5"),
("camera_19211087_N-5","camera_87","camera_87","camera_87_N-5"),
("camera_19211080_N-5","camera_80","camera_80","camera_80_N-5"),
("camera_19211038_N-5","camera_38","camera_38","camera_38_N-5"),
("camera_192110223_N-5","camera_223","camera_223","camera_223_N-5"),
("camera_192110222_N-5","camera_222","camera_222","camera_222_N-5"),
("camera_192110224_N-5","camera_224","camera_224","camera_224_N-5"),
("camera_192110225_N-5","camera_225","camera_225","camera_225_N-5"),
("camera_192110216_N-5","camera_216","camera_216","camera_216_N-5"),
("camera_192110212_N-5","camera_212","camera_212","camera_212_N-5"),
("camera_192110217_N-5","camera_217","camera_217","camera_217_N-5"),
("camera_192110218_N-5","camera_218","camera_218","camera_218_N-5"),
("camera_192110219_N-5","camera_219","camera_219","camera_219_N-5"),
("camera_192110221_N-5","camera_221","camera_221","camera_221_N-5"),
("camera_192110221_N-5","camera_221","camera_221","camera_221_N-5"),
("camera_192110213_N-5","camera_213","camera_213","camera_213_N-5"),
("camera_192110214_N-5","camera_214","camera_214","camera_214_N-5"),
("camera_192110215_N-5","camera_215","camera_215","camera_215_N-5"),
("camera_192110173_N-5","camera_173","camera_173","camera_173_N-5"),
("camera_19211049_N-5","camera_49","camera_49","camera_49_N-5"),
("camera_19211052_N-5","camera_52","camera_52","camera_52_N-5"),
("camera_19211051_N-5","camera_51","camera_51","camera_51_N-5"),
("camera_19211050_N-5","camera_50","camera_50","camera_50_N-5"),
("camera_19211063_N-5","camera_63","camera_63","camera_63_N-5"),
("camera_19211040_N-5","camera_40","camera_40","camera_40_N-5"),
("camera_19211041_N-5","camera_41","camera_41","camera_41_N-5"),
("camera_19211027_N-5","camera_27","camera_27","camera_27_N-5"),
("camera_19211034_N-5","camera_34","camera_34","camera_34_N-5"),
("camera_19211070_N-5","camera_70","camera_70","camera_70_N-5"),
("camera_192110226_N-5","camera226","Camera_226","Camera_226_N-5"),
("camera_192110227_N-5","camera227","Camera_227","Camera_227_N-5"),
("camera_192110228_N-5","camera228","Camera_228","Camera_228_N-5"),
("camera_192110229_N-5","camera229","Camera_229","Camera_229_N-5"),
("camera_192110232_N-5","camera232","Camera_232","Camera_232_N-5"),
("camera_192110233_N-5","camera233","Camera_233","Camera_233_N-5"),
("camera_192110234_N-5","camera234","Camera_234","Camera_234_N-5"),
("camera_192110235_N-5","camera235","Camera_235","Camera_235_N-5"),
("camera_192110236_N-5","camera236","Camera_236","Camera_236_N-5"),
("camera_192110237_N-5","camera237","Camera_237","Camera_237_N-5"),
("camera_192110238_N-5","camera238","Camera_238","Camera_238_N-5"),
("camera_192110239_N-5","camera239","Camera_239","Camera_239_N-5"),
("camera_192110240_N-5","camera240","Camera_240","Camera_240_N-5"),
("camera_192110241_N-5","camera241","Camera_241","Camera_241_N-5"),
("camera_192110242_N-5","camera242","Camera_242","Camera_242_N-5"),
("camera_192110243_N-5","camera243","Camera_243","Camera_243_N-5"),
("camera_192110244_N-5","camera244","Camera_244","Camera_244_N-5"),
("camera_192110245_N-5","camera245","Camera_245","Camera_245_N-5"),
("camera_192110211_N-5","camera_211","camera_211","camera_211_N-5"),
("camera_192110210_N-5","camera210","Camera_210","Camera_210_N-5"),
("camera_192110246_N-5","camera246","Camera_246","Camera_246_N-5"),
("camera_19212247_N-5","camera247","Camera_247","Camera_247_N-5"),
("camera_192110248_N-5","camera248","Camera_248","Camera_248_N-5"),
("camera_19212249_N-5","camera249","Camera_249","Camera_249_N-5"),
("camera_192110140_N-5","camera140","Camera_140","Camera_140_N-5"),
("camera_192110141_N-5","camera141","Camera_141","Camera_141_N-5"),
("camera_192110142_N-5","camera142","Camera_142","Camera_142_N-5"),
("camera_192110143_N-5","camera143","Camera_143","Camera_143_N-5"),
("camera_192110144_N-5","camera144","Camera_144","Camera_144_N-5"),
("camera_192110146_N-5","camera146","Camera_146","Camera_146_N-5"),
("camera_192110149_N-5","camera149","Camera_149","Camera_149_N-5"),
("camera_192110156_N-5","camera156","Camera_156","Camera_156_N-5"),
("camera_192110160_N-5","camera160","Camera_160","Camera_160_N-5"),
("camera_192110153_N-5","camera153","Camera_153","Camera_153_N-5")]

plannedManPower = db.plannedManPower
intelligenceData = db.intelligenceData
processedFrames = db.processedFrames

# for (newCamId,old1,old2,old3) in cam_array:
#     print(newCamId,old1,old2,old3)
#     # plannedManPower.update({"camId" : str(re.findall(r'\d+', old1)[0])}, {"$set" : {"camId" : newCamId}}, multi=True)
#     # intelligenceData.update({ "$or" : [ {"camId" : old1}, {"camId" : old2}, {"camId" : old3}] }, {"$set" : {"camId" : newCamId}}, multi=True)
#     processedFrames.update({ "$or" : [ {"camId" : old1}, {"camId" : old2}, {"camId" : old3}] }, {"$set" : {"camId" : newCamId}}, multi=True)
#     # print(str(re.findall(r'\d+', old1)[0]))

##############################################################################################################################################################################################
##############################################################################################################################################################################################
##############################################################################################################################################################################################
##############################################################################################################################################################################################
##############################################################################################################################################################################################
import dateutil.parser
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from itertools import chain

# aggPipeline = [
#     {
#         "$match" : {
#             "time" : {
#                 "$gte" : dateutil.parser.parse("2019-05-07T00:04:53.618Z")
#                 }
#         }
#     },{
#         "$project" : {
#             "_id":0,
#             "camId":1,
#             "confScores": {
#                 "$reduce": {
#                       "input": "$confScores",
#                       "initialValue": [],
#                       "in": {
#                           "$concatArrays": [ '$$value', '$$this' ]
#                     }
#                 }
#             }
#         }
#     },{
#         "$group" : {
#             "_id" : "$camId",
#             "confScores" : {
#                 "$push" : "$confScores"
#             }
#         }
#     },{
#         "$project" : {
#             "_id":1,
#             "confScores": {
#                 "$reduce": {
#                       "input": "$confScores",
#                       "initialValue": [],
#                       "in": {
#                           "$concatArrays": [ '$$value', '$$this' ]
#                     }
#                 }
#             }
#         }
#     }
# ]

aggPipeline = [
    {
        "$lookup": {
            "from": "cameras",
            "localField": "camId",
            "foreignField": "camName",
            "as": "camera"
            }
    }, {
        "$unwind": '$camera'
    }, {
        "$project": {
            "stats": '$camera.aiStats',
            "camId": 1,
            "bboxes":1,
            "time":1,
            "fileName":1,
            "path":1,
            "confScores":1
        }
    },
    {
        "$match" : {
            "time" : {
                "$gte" : dateutil.parser.parse("2019-05-08T00:04:53.618Z")
                }
        }
    },{
        "$project" : {
            "_id":1,
            "camId":1,
            "stats":1,
            "confScores": {
                "$reduce": {
                      "input": "$confScores",
                      "initialValue": [],
                      "in": {
                          "$concatArrays": [ '$$value', '$$this' ]
                    }
                }
            }
        }
    },{
        "$group" : {
            "_id" : "$camId",
            "confScores" : {
                "$push" : "$confScores"
            },
            "avgThreshold": { "$avg": "$stats.threshold" }
        }
    }
]

def Average(lst):
    return sum(lst) / len(lst)

excel_json = []

try:
    result = list(processedFrames.aggregate(aggPipeline))
    # print(len(result), result)
    for cam in result:
        # for elem in cam['confScores']:
        #
        # cam['confScores'] = np.asarray(cam['confScores']).flatten()
        if(not cam['confScores'] == None):
            cam['confScores'] = filter(None, cam['confScores'])
            cam['confScores'] = list(chain.from_iterable(cam['confScores']))
            cam['confScores'] = [ ('%.2f' % elem) for elem in cam['confScores'] ]
            cam['confScores'] = list(map(float, cam['confScores']))
            cam['avgConf'] = str('%.2f' % Average(cam['confScores']))

            cam_json_excel = {}
            cam_json_excel['Confidence_Score'] = cam['avgConf']
            cam_json_excel['Camera_ID'] = cam['_id']
            cam_json_excel['Threshold'] = str(cam['avgThreshold'])
            excel_json.append(cam_json_excel)

            print(cam['_id'])
            pprint.pprint(np.array(cam['confScores']))

            x = result
            fig, axs = plt.subplots(figsize=(6,4))
            axs.hist(np.array(cam['confScores']), rwidth=0.5 ,color='g')
            axs.set_xticks(axs.get_xticks()[::1])
            plt.title('Threshold - ' + str(cam['avgThreshold']) + ' Avg Conf - ' + str('%.2f' % Average(cam['confScores'])),loc='center')
            plt.ylabel('Frequency');
            plt.xlabel('Confidence scores - ' + cam['_id']);
            # plt.figure(figsize=(8,8))
            plt.savefig(cam['_id']+'.png', dpi = 400)
except Exception as e:
    print(e)


df = pd.DataFrame.from_dict(excel_json)
print(df)
df.to_excel('Summary.xlsx')
##############################################################################################################################################################################################
##############################################################################################################################################################################################
##############################################################################################################################################################################################
##############################################################################################################################################################################################
##############################################################################################################################################################################################
