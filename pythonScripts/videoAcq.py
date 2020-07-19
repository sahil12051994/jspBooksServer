# producer.py
import time
import cv2
from kafka import KafkaProducer
import sys
import datetime
import random
import _pickle as cPickle
#  connect to Kafka
producer = KafkaProducer(bootstrap_servers='localhost:9092', value_serializer=lambda v: cPickle.dumps(v))
# Assign a topic
# fileName = sys.argv[1]
# extension = sys.argv[2]
# userId = sys.argv[3]

fileName = "output2"
extension = "avi"
userId = "5c7fb3c7e6fe524f734f1370"
topic = "VideoStream_zero_two"

def video_emitter(video):
    # Open the video
    print(video,  ' emitting.....')
    video = cv2.VideoCapture(video)
    data = {}

    # read the file
    while (video.isOpened):
        try:
            # read the image in each frame
            print('OPEN')
            success, image = video.read()
            if(success is False):
                break;
            image = cv2.resize(image,(1920,1080))
            if(image is None):
                break;
            h, w, c = image.shape

            print(h,w,c)
            # check if the file has read to the end
            if not success:
                print("Frame break")
                break
            # convert the image png
            ret, jpeg = cv2.imencode('.jpg', image)

            timestamp = datetime.datetime.now()
            data['time'] = str(timestamp)
            data['image'] = jpeg.tobytes()
            data['camera'] = "upload_" + fileName
            data['height'] = h
            data['width'] = w
            data['camId'] = userId
            r1 = random.randint(0, 100)
            print(data['time'],data['camera'],data['camId'], r1)
            # Convert the image to bytes and send to kafka
            producer.send(topic, data, partition=r1)
            # To reduce CPU usage create sleep time of 0.2sec
            time.sleep(0.2)
        except Exception as e:
            print (e)
    # clear the capture
    video.release()
    print('done emitting')
    # print("Hellllooooo")

if __name__ == '__main__':
    # video_emitter("/home/hercules/Desktop/planned_manpower/" + topic + "." + extension)
    video_emitter("/home/hercules/Desktop/planned_manpower/" + fileName + "." + extension)
