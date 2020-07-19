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
        db = client[dbObject['mongodb']['dbSDName']]
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

# book = xlrd.open_workbook("/home/jbm/manpowerProject/manpowerProject/utils/SD CCTV ALERTS RPL.xlsx")
book = xlrd.open_workbook("/home/jbm/manpowerProject/manpowerProject/utils/SD CCTV ALERTS.xlsx")
# book = xlrd.open_workbook("/home/jbm/manpowerProject/manpowerProject/utils/AnandGroup.xlsx")
# book = xlrd.open_workbook("/home/jbm/manpowerProject/manpowerProject/utils/MINDA FR.xlsx")

print("The number of worksheets is {0}".format(book.nsheets))
print("Worksheet name(s): {0}".format(book.sheet_names()))
sh = book.sheet_by_index(0)
for rx in range(sh.nrows):
    tempObj = {}
    plantId = str(sh.row(rx)[0].value).split(".")[0]
    channel = str(sh.row(rx)[3].value).split(".")[0].lower()
    if(not plantId == ""):
        tempObj['companyId'] = 'JBMGroup'
        # tempObj['companyId'] = 'RPLGroup'
        # tempObj['companyId'] = 'AnandGroup'
        tempObj['camName'] = "cam_" + ''.join(sh.row(rx)[2].value.split(".")).replace(" ", "") + "_" + channel + "_" + plantId + "_" + tempObj['companyId']
        tempObj['plant'] = plantId
        tempObj['plantLocation'] = sh.row(rx)[1].value
        tempObj['cameraLocation'] = sh.row(rx)[9].value
        tempObj['location'] = sh.row(rx)[9].value
        tempObj['hardware'] = {}
        tempObj['hardware']['ip'] = sh.row(rx)[2].value
        tempObj['hardware']['make'] = sh.row(rx)[8].value.lower()
        tempObj['hardware']['hardwareNumber'] = 0
        tempObj['hardware']['port'] = '554'
        tempObj['hardware']['type'] = sh.row(rx)[4].value.lower()
        tempObj['hardware']['channel'] = channel
        tempObj['login'] = {}
        tempObj['login']['username'] = sh.row(rx)[6].value
        tempObj['login']['password'] = str(sh.row(rx)[7].value).split(".")[0]
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
    			"microserviceName" : "socialDistance",
                # "microserviceName" : "faceRecog",
    			"usageType" : [
    				0,
    				1
    			]
    		}
    	]
        # tempObj['mailingList'] = []

        tempPhone = []
        tempEmail = []
        try:
            tempPhone = sh.row(rx)[11].value.split(",")
            tempEmail = sh.row(rx)[12].value.split(",")
            tempObj['mailingList'] = tempPhone + tempEmail
        except:
            print("Error in row")
            tempObj['mailingList'] = []
        # print(tempPhone, tempEmail)

        # tempObj['iotDeviceIds'] = [plantId]
        tempObj['iotDeviceIds'] = [str(sh.row(rx)[5].value).split(".")[0]]
        mainArray.append(tempObj)
        print("\n\n",tempObj)

print("Total Cameras: ", len(mainArray))
# print(db)
cameras = db.cameras

for cam in mainArray:
    cameras.update_one({
        'camName' : cam['camName']
    }, {
        '$set': cam
    }, upsert = True )
    print("Inserted")
