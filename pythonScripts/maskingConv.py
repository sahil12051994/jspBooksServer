import os
import cv2
import numpy as np
from matplotlib import pyplot as plt

path = '/home/hercules/Code_files/masks_cameras/filtered'
path_roi = '/home/hercules/aiProject/dashboard/JBM_Dashboard/utils/masks/filtered_roi'
dirs = os.listdir( path )

for item in dirs:
    img = cv2.imread(path +"/"+item)
    img = cv2.resize(img, (800,600), interpolation = cv2.INTER_AREA)
    print(path +"/"+item)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
    img[np.where((img==[0,0,0,255]).all(axis=2))] = [0,0,200,255]
    img[np.where((img==[255,255,255,255]).all(axis=2))] = [0,0,0,0]
    dim = (800,600)

    # img[np.where((img==[255,255,255,255]).all(axis=2))] = [0,0,0,0]
    print(img.shape)

    # img[np.all(img==[0,0,0,0], axis=2)] = [255,0,0,255]


    cv2.imwrite(os.path.join(path_roi , item.split(".")[0] + ".png"), img)
    # cv2.waitKey(  0)
