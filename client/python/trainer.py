import os#import os
import cv2#import opencv
import numpy as np #import numpy
from PIL import Image#import pillow
from pathlib import Path#require read path
p = Path()

absolutepath =  str(p.absolute()).replace('\\', '/')+'/python'
recognizer = cv2.face.LBPHFaceRecognizer_create()#define opencv LBPH recognizer
path = absolutepath +'/dataset'
if not os.path.exists(absolutepath +'/lbph_recognizer'):#check if the file exist
    os.makedirs(absolutepath +'/lbph_recognizer')

#train image with with align the macth with its label name pattern
def getImagesWithID(path):
	imagePaths = [os.path.join(path,f) for f in os.listdir(path)]
	faces = []#init variable
	IDs = []#init variable
	for imagePath in imagePaths:#read all existing image
		faceImg = Image.open(imagePath).convert('L')#converting image to greyscale
		faceNp = np.array(faceImg,'uint8')#encode face image to unit8 array
		ID = int(os.path.split(imagePath)[-1].split('.')[1])
		#split the name pattern from User.1.12 take the middle value(id)
		faces.append(faceNp)#take the encoded value push into the faces array
		IDs.append(ID)#take the extracted id from image files name push to IDs array
		#cv2.imshow("training",faceNp)
		cv2.waitKey(10)
	return np.array(IDs), faces

Ids, faces = getImagesWithID(path)#call to extract image data from dataset folder
recognizer.train(faces,Ids)#LBPH Training process
recognizer.save(absolutepath + '/lbph_recognizer/trainingData.yml')#save trained file as yml
print("data trained")
cv2.destroyAllWindows()#exit cv