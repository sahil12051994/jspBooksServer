import xlrd
from collections import OrderedDict
import csv, json
import simplejson as json
import re
import datetime
import dateutil.parser as parser
import pymongo
import yaml
import os
import glob
import sys
"""
mongodb model:
{
    camId: [
        {
            Type: "0->Regular/1->Break/2->Testing/3->Audit"
            planned_manpower : Int
            start_time: DateTime object
            end_time: DateTime object
        }
    ]
}
"""
global db
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

def getCamIdFromName(camName):
    for camera in cameras.find():
        if(camera['camName'] == camName):
            return camera['_id']

go_ahead_parsing = 0
# Open the workbook and select the first worksheet
folder_path = "/home/hercules/Desktop/planned_manpower/*"
list_of_files = glob.glob(folder_path)
latest_file = max(list_of_files, key=os.path.getctime)
# if(datetime.datetime.today().strftime('%Y-%m-%d') == latest_file.split("/")[-1].split(".")[0]):
#     go_ahead_parsing = 1
# print(datetime.datetime.today().strftime('%Y-%m-%d'))
# print(latest_file.split("/")[-1].split(".")[0])
go_ahead_parsing = 1
file = xlrd.open_workbook(latest_file)
sheet = file.sheet_by_index(0)

def convertStringTime(time):
    #dateToday = datetime.date.today()

    # dateToday = datetime.datetime.strptime(latest_file.split("/")[-1].split(".")[0], "%Y-%m-%d").date()

    dateToday = datetime.datetime.strptime(sys.argv[2], "%Y-%m-%d").date()
    dateTimeObject = datetime.datetime.combine(dateToday, datetime.datetime.strptime(time, '%H:%M').time())
    isoFormat = parser.parse(parser.parse(dateTimeObject.strftime("%Y-%m-%d %H:%M:%S")).isoformat())
    return isoFormat

if(go_ahead_parsing == 1):
    # Iterate through each row in worksheet and fetch values into dict
    timeIntervalList = []
    listToBeInserted = []
    n = 0
    for rowx in range(sheet.nrows):
        actual_people_dic = {}
        if n < 2:
            n = n + 1
            continue
        if(n==2):
            timeRow = list(sheet.row_values(rowx))
            for timeInterval in timeRow:
                if(not timeInterval == ''):
                    oneIntervalTimeObject = []
                    oneIntervalTimeObject.append(convertStringTime(timeInterval.split('-')[0].strip()))
                    oneIntervalTimeObject.append(convertStringTime(timeInterval.split('-')[1].strip().split(' ')[0]))
                    timeIntervalList.append(oneIntervalTimeObject)
            n = n + 1
            # print(len(timeIntervalList))
            continue
        if(n >= 3):
            cameraRow = list(sheet.row_values(rowx))
            cam_id = cameraRow.pop(0)
            if(len(re.findall(r'\d+', cam_id)) == 0):
                break
            # print(re.findall(r'\d+', cam_id))
            cam_no = str(re.findall(r'\d+', cam_id)[0])
            actual_people_dic = {}
            actual_people_dic['camId'] = cam_id
            # actual_people_dic['camIdRef'] = getCamIdFromName(cam_id)
            actual_people_dic['data'] = []
            actual_people_dic['date'] = timeIntervalList[0][0]
            actual_people_dic['upload'] = {}
            actual_people_dic['upload']['userId'] = sys.argv[1]

            # print(len(actual_people_dic))
            for count,timeInterval in enumerate(cameraRow):
                # if(count < 24):
                oneInterval = {}
                if(not (timeInterval == 'BREAK' or timeInterval == 'Break')):
                    oneInterval['Type'] = 0
                    oneInterval['planned_manpower'] = timeInterval
                else:
                    oneInterval['Type'] = 1
                    oneInterval['planned_manpower'] = 0
                oneInterval['start_time'] = timeIntervalList[count][0]
                oneInterval['end_time'] = timeIntervalList[count][1]
                actual_people_dic['data'].append(oneInterval)
            # if(actual_people_dic['camId'] == '218'):
            #     print(actual_people_dic)

            listToBeInserted.append(actual_people_dic)
            # print(listToBeInserted)

def insertDataToMongo():
    # print(listToBeInserted, "\n")
    for camera in listToBeInserted:
        print("camera", camera)
        try:
            print("camera=========>",camera['camId'],"\n")
            mycol = db["plannedManPower"]
            x = mycol.insert_one(camera)
            print("successfully inserted one camera \n")
        except Exception as e:
            print("DB insertion failed")
            print(e)

insertDataToMongo()
# print(listToBeInserted[0])
# print(timeIntervalList)
# j = json.dumps(actual_people_dic)
