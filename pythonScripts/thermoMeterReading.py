#!/usr/bin/env python
# coding: utf-8

from flask import Flask
from flask_cors import CORS
from imutils.perspective import four_point_transform
from imutils import contours
import imutils
import cv2

import numpy as np

app = Flask(__name__)
CORS(app)

# define the dictionary of digit segments so we can identify
# each digit on the thermostat
DIGITS_LOOKUP = {
    (1, 1, 1, 0, 1, 1, 1): 0,
    (0, 0, 1, 0, 0, 1, 0): 1,
    (1, 0, 1, 1, 1, 1, 0): 2,
    (1, 0, 1, 1, 0, 1, 1): 3,
    (0, 1, 1, 1, 0, 1, 0): 4,
    (1, 1, 0, 1, 0, 1, 1): 5,
    (1, 1, 0, 1, 1, 1, 1): 6,
    (1, 0, 1, 0, 0, 1, 0): 7,
    (1, 1, 1, 1, 1, 1, 1): 8,
    (1, 1, 1, 1, 0, 1, 1): 9
}

def fetch_image_from_video():
    # add video stream params to function input
    video_stream = None
    if video_stream is None:
        vidcap = cv2.VideoCapture(0)
    else:
        # write code for processing online stream to get image
        pass
    success,image = vidcap.read()
    if success:
        # image = cv2.imread("/home/sahil/Downloads/frame4sec.jpg")
        return image

def adjust_gamma(image, gamma=1.0):
    # build a lookup table mapping the pixel values [0, 255] to
    # their adjusted gamma values
    invGamma = 1.0 / gamma
    table = np.array([((i / 255.0) ** invGamma) * 255
        for i in np.arange(0, 256)]).astype("uint8")
    # apply gamma correction using the lookup table
    return cv2.LUT(image, table)

def get_image_thresh(image, brighten=False):
    # load the example image
    if image is None:
        image = cv2.imread("/home/sahil/Downloads/frame4sec.jpg")
    else:
        image = fetch_image_from_video()
    y = 140
    h = 158
    x = 214
    w = 270

    # pre-process the image by resizing it, converting it to
    # graycale, blurring it, and computing an edge map
    image = imutils.resize(image, height=500)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = gray[y:y+h, x:x+w]
    if brighten is True:
        gray = adjust_gamma(gray, 2.0)
#     blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # threshold the warped image, then apply a series of morphological
    # operations to cleanup the thresholded image
    thresh = cv2.threshold(gray, 0, 255,
        cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]
#     kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (1, 2))
#     thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
    kernel = np.ones((3,3), np.uint8)
#     thresh = cv2.erode(thresh, kernel, iterations=1)
#     thresh = cv2.dilate(thresh, kernel, iterations=2)

    return thresh, gray

def detect_no_bbox(thresh, gray):
    # find contours in the thresholded image, then initialize the
    # digit contours lists
    global DIGITS_LOOKUP
    cnts = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE)
    cnts = imutils.grab_contours(cnts)
    digitCnts = []

    # loop over the digit area candidates
    for c in cnts:
        # compute the bounding box of the contour
        (x, y, w, h) = cv2.boundingRect(c)

        # if the contour is sufficiently large, it must be a digit
        if w >= 15 and (h >= 40 ):
            digitCnts.append(c)

    # sort the contours from left-to-right, then initialize the
    # actual digits themselves
    digitCnts = contours.sort_contours(digitCnts,
        method="left-to-right")[0]
    digits = []

    # loop over each of the digits
    for c in digitCnts:
        try:
            # extract the digit ROI
            (x, y, w, h) = cv2.boundingRect(c)
            roi = thresh[y:y + h, x:x + w]

            # compute the width and height of each of the 7 segments
            # we are going to examine
            (roiH, roiW) = roi.shape
            (dW, dH) = (int(roiW * 0.25), int(roiH * 0.15))
            dHC = int(roiH * 0.05)

            # define the set of 7 segments
            segments = [
                ((0, 0), (w, dH)),	# top
                ((0, 0), (dW, h // 2)),	# top-left
                ((w - dW, 0), (w, h // 2)),	# top-right
                ((0, (h // 2) - dHC) , (w, (h // 2) + dHC)), # center
                ((0, h // 2), (dW, h)),	# bottom-left
                ((w - dW, h // 2), (w, h)),	# bottom-right
                ((0, h - dH), (w, h))	# bottom
            ]
            on = [0] * len(segments)

            # loop over the segments
            for (i, ((xA, yA), (xB, yB))) in enumerate(segments):
                # extract the segment ROI, count the total number of
                # thresholded pixels in the segment, and then compute
                # the area of the segment
                segROI = roi[yA:yB, xA:xB]
                total = cv2.countNonZero(segROI)
                area = (xB - xA) * (yB - yA)

                # if the total number of non-zero pixels is greater than
                # 50% of the area, mark the segment as "on"
                if total / float(area) > 0.5:
                    on[i]= 1

            # lookup the digit and draw it on the image
            digit = DIGITS_LOOKUP[tuple(on)]
            digits.append(digit)
            cv2.rectangle(gray, (x, y), (x + w, y + h), (0, 255, 0), 1)
            cv2.putText(gray, str(digit), (x + 20, y + 20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 255, 0), 2)
            # print("number is : ", digit)
        except:
            print("number not found")

    print(u"{}{}.{}".format(*digits))

    return digits

def analyse():
    image = fetch_image_from_video()
    thresh, gray = get_image_thresh(image, brighten=True)
    digits = detect_no_bbox(thresh, gray)
    return digits

@app.route('/')
def hello_world():
    temp = analyse()
    tempStr = str(temp[0]) + str(temp[1]) + "." + str(temp[2])
    return tempStr

if __name__ == "__main__":
    app.run()
