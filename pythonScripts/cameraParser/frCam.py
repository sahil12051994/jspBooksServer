import xlrd
from collections import OrderedDict
import csv, json
# import simplejson as json
import re
import datetime
import dateutil.parser as parser
import pymongo
import yaml
import os
import glob
import sys


def connectDB(dbObject):
    global db
    try:
        print("MongoDB Connection Started")
        client = pymongo.MongoClient(dbObject['mongodb']['address'], dbObject['mongodb']['port'])
        db = client[dbObject['mongodb']['dbFRName']]
        print("MongoDB Connection successfull")
    except:
        print("DB Connection error occurred")

try:
    with open("/home/jbm/manpowerProject/manpowerProject/utils/server.yml", 'r') as ymlfile:
        cfg_server = yaml.load(ymlfile)
    connectDB(cfg_server['database'])
except IOError:
    print("Server Config file does not appear to exist.")

mainArray = []

book = xlrd.open_workbook("/home/jbm/manpowerProject/manpowerProject/utils/FR CCTV.xlsx")
# book = xlrd.open_workbook("/home/jbm/manpowerProject/manpowerProject/utils/SD CCTV ALERTS.xlsx")
# book = xlrd.open_workbook("/home/jbm/manpowerProject/manpowerProject/utils/MINDA SD.xlsx")
# book = xlrd.open_workbook("/home/jbm/manpowerProject/manpowerProject/utils/MINDA FR.xlsx")

print("The number of worksheets is {0}".format(book.nsheets))
print("Worksheet name(s): {0}".format(book.sheet_names()))
sh = book.sheet_by_index(0)
for rx in range(sh.nrows):
    tempObj = {}
    plantId = str(sh.row(rx)[0].value).split(".")[0]
    if(not plantId == ""):
        tempObj['camName'] = "cam_" + ''.join(sh.row(rx)[2].value.split(".")) + "_" + plantId
        tempObj['companyId'] = 'JBMGroup'
        # tempObj['companyId'] = 'MINDA'
        tempObj['plant'] = plantId

        if(sh.row(rx)[8].value == "Attendance") :
            tempObj['usageType'] = "fr"
        elif(sh.row(rx)[8].value == "Access_Control"):
            tempObj['usageType'] = "fr|accessControl"

        tempObj["IoTDevices"] = [
    		{
    			"type" : "local",
    			"ip" : "",
    			"usageType" : "accessControl"
    		},
    		{
    			"type" : "webcam",
    			"ip" : "localhost:5000",
    			"usageType" : "tempAutomation"
    		}
    	]
        tempObj['plantLocation'] = sh.row(rx)[1].value
        tempObj['cameraLocation'] = sh.row(rx)[6].value
        tempObj['location'] = sh.row(rx)[6].value
        tempObj['hardware'] = {}
        tempObj['hardware']['ip'] = sh.row(rx)[2].value
        tempObj['hardware']['make'] = sh.row(rx)[5].value.lower()
        tempObj['hardware']['hardwareNumber'] = 0
        tempObj['hardware']['port'] = '554'
        tempObj['login'] = {}
        tempObj['login']['username'] = sh.row(rx)[3].value
        tempObj['login']['password'] = str(sh.row(rx)[4].value).split(".")[0]
        if(not tempObj['login']['username'] and tempObj['login']['password']):
            continue
        tempObj['status'] = 1
        tempObj['aiStats'] = {
    		"threshold" : 0.1,
    		"precision" : 0.99,
    		"recall" : 0.95
    	}
        tempObj['deploymentDetails'] = [
    		{
    			# "microserviceName" : "socialDistance",
                "microserviceName" : "faceRecog",
    			"usageType" : [
    				0,
    				1
    			]
    		}
    	]
        tempObj['mailingList'] = []
        # tempPhone = sh.row(rx)[8].value.split(",")
        # tempEmail = sh.row(rx)[9].value.split(",")
        # # print(tempPhone, tempEmail)
        # tempObj['mailingList'] = tempPhone + tempEmail

        # tempObj['iotDeviceIds'] = [plantId]
        tempObj['iotDeviceIds'] = [str(sh.row(rx)[7].value).split(".")[0]]
        mainArray.append(tempObj)
        print(tempObj)

# print("Total Cameras: ", mainArray)
# print(db)

cameras = db.cameras

for cam in mainArray:
    cameras.update_one({
        'camName' : cam['camName']
    }, {
        '$set': cam
    }, upsert = True )
    print("Inserted")
