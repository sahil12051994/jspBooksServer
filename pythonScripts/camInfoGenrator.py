##########################lin##############################################################
import yaml
global db
import pymongo

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
    with open("../config/server.yml", 'r') as ymlfile:
        cfg_server = yaml.load(ymlfile)
    connectDB(cfg_server['database'])
except IOError:
    print("Server Config file does not appear to exist.")

#########################################################################################

cameras = db.cameras
camera_array = []
for camera in cameras.find():
    if(camera['status'] == 2 or camera['status'] == 1):
        cam_password = str(camera['login']['password'])
        if(cam_password == 'password@123'):
            cam_password = 'password%40123'
        if(camera['hardware']['make'] == 'Covert'):
            rtsp_link = "rtsp://" + camera['login']['username'] + ":" + cam_password + '@' + camera['hardware']['ip'] + "/live/0/MAIN"
        elif(camera['hardware']['make'] == 'Samsung'):
            rtsp_link = "rtsp://" + camera['login']['username'] + ":" + cam_password + '@' + camera['hardware']['ip'] + "/onvif/profile2/media.smp"
        elif(camera['hardware']['make'] == 'Hikvision'):
            rtsp_link = "rtsp://" + camera['login']['username'] + ":" + cam_password + '@' + camera['hardware']['ip'] + "/Streaming/Channels/101"
        camera_array.append((rtsp_link, camera['_id'],camera['camName']))
############################################################################################

# print(camera_array)
with open('camInfo.txt', 'w') as filehandle:
    for camItem in camera_array:
        print(camItem[0])
        filehandle.write("" + str(camItem[0]) + " " + str(camItem[2]) +" 1"+ "\n")
