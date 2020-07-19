import cv2
import numpy as np
import matplotlib.pyplot as plt
import sys

face_cascade = cv2.CascadeClassifier('/home/jbm/faceRecogDashboard/utils/haarcascade_frontalface_default.xml')

frame = cv2.imread(sys.argv[1])

faces = face_cascade.detectMultiScale(frame, 1.1, 4)
if(len(faces) >= 1):
    for (x, y, w, h) in faces:
        cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)

        crop_img = frame[y:y+h, x:x+w]
        # Display the output
        # cv2.imshow('img', crop_img)
        # cv2.waitKey()

        gray = crop_img
        # hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        # gray = hsv[:, :, 2]
        hist = cv2.calcHist([gray], [0], None, [256], [0, 256])
        # plt.figure()
        # plt.title("Grayscale Histogram")
        # plt.xlabel("Bins")
        # plt.ylabel("# of Pixels")
        # plt.plot(hist)
        # plt.xlim([0, 256])
        # plt.show()

        bright_thres = 0.5
        dark_thres = 0.4
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        dark_part = cv2.inRange(gray, 0, 30)
        bright_part = cv2.inRange(gray, 220, 255)
        # use histogram
        # dark_pixel = np.sum(hist[:30])
        # bright_pixel = np.sum(hist[220:256])
        total_pixel = np.size(gray)
        dark_pixel = np.sum(dark_part > 0)
        bright_pixel = np.sum(bright_part > 0)
        if dark_pixel/total_pixel > bright_thres:
            print("Underexposed")
        elif bright_pixel/total_pixel > dark_thres:
            print("Overexposed")
        else:
            print("Acceptable")
        # print(dark_pixel/total_pixel)
