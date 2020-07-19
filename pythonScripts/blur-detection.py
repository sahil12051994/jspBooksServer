# import the necessary packages
from imutils import paths
import argparse
import cv2
import sys

def variance_of_laplacian(image):
	# compute the Laplacian of the image and then return the focus
	# measure, which is simply the variance of the Laplacian
	return cv2.Laplacian(image, cv2.CV_64F).var()

# imagePath = "/home/jbmai/faceRecognitionProduction/insightFaceDetection/deploy/Training_data/sandeep_22560/top.jpg"
# print(sys.argv[1])
imagePath = sys.argv[1]
image = cv2.imread(imagePath)
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
fm = variance_of_laplacian(gray)
print(str(fm))
