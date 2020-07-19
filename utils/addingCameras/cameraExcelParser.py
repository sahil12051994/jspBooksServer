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
        db = client[dbObject['mongodb']['dbName']]
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
print("The number of worksheets is {0}".format(book.nsheets))
print("Worksheet name(s): {0}".format(book.sheet_names()))
sh = book.sheet_by_index(0)
for rx in range(sh.nrows):
    tempObj = {}
    plantId = str(sh.row(rx)[0].value).split(".")[0]
    if(not plantId == ""):
        tempObj['camName'] = "cam_" + ''.join(sh.row(rx)[2].value.split(".")) + "_" + plantId
        tempObj['plant'] = sh.row(rx)[1].value
        tempObj['location'] = sh.row(rx)[6].value
        tempObj['hardware'] = {}
        tempObj['hardware']['ip'] = sh.row(rx)[2].value
        tempObj['hardware']['make'] = sh.row(rx)[5].value.lower()
        tempObj['hardware']['hardwareNumber'] = 0
        tempObj['hardware']['port'] = '554'
        tempObj['login'] = {}
        tempObj['login']['username'] = sh.row(rx)[3].value
        tempObj['login']['password'] = str(sh.row(rx)[4].value).split(".")[0]
        tempObj['status'] = 1
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
        tempObj['iotDeviceIds'] = [plantId]
        mainArray.append(tempObj)
        print(tempObj)

# print("Total Cameras: ", mainArray)
print(db)
cameras = db.cameras

for cam in mainArray:
    cameras.update_one({
        'camName' : cam['camName']
    }, {
        '$set': cam
    }, upsert = True )
    print("Inserted")
