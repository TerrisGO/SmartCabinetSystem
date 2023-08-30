import cv2#import opencv
import numpy as np#import numpy
import sqlite3#import sqlite 3
import os#import operating system for file manage
import screeninfo#import to gather screen detail
from pathlib import Path#import parthlib to get absoolute path
p = Path()
 
screen_id = 0
screen = screeninfo.get_monitors()[screen_id]#gather first screen info

absolutepath =  str(p.absolute()).replace('\\', '/')+'/python'
conn = sqlite3.connect(absolutepath +'/sqlite_database.db')

#temporaory file if user cancel able delete instantly
if not os.path.exists(absolutepath +'/temp_dataset'):
    os.makedirs(absolutepath +'/temp_dataset')

#the real file to train, images will move from temp to here
if not os.path.exists(absolutepath +'/dataset'):
    os.makedirs(absolutepath +'/dataset')

c = conn.cursor()#initialize db cursor

face_cascade = cv2.CascadeClassifier(absolutepath +'/haar_features/haarcascade_frontalface_default.xml')

cap = cv2.VideoCapture(0)#start camera capture
width  = cap.get(cv2.CAP_PROP_FRAME_WIDTH) #gather the width of frame
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) #gather the height of frame
#default name as"
uname = "known"
#execute sqlite command
c.execute('INSERT INTO users (name) VALUES (?)', (uname,))
#read the last row ID
uid = c.lastrowid

sampleNum = 0#use to count amout of captured image

# org font setting for position start from bottom-left corner
org = (50, 50) 
  
# Line thickness of 2 px 
thickness = 2 
while True:
	ret, img = cap.read()#capture frame
	y = int((width-height)//2)#find actually middle point of frame
	gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)#convert frame to greyscale
	faces = face_cascade.detectMultiScale(gray, 1.3, 5)#detect the exist face on frame
	for (x,y,w,h) in faces:
		sampleNum = sampleNum+1#increment count
		#write the detected face image to tempdata folder
		cv2.imwrite(absolutepath +"/temp_dataset/User."+str(uid)+"."+str(sampleNum)+".jpg",gray[y:y+h,x:x+w])
		cv2.rectangle(img, (x,y), (x+w, y+h), (255,0,0), 2)
		cv2.putText(img, 'Scanning', org, cv2.FONT_HERSHEY_SIMPLEX,  1, (255, 0, 0) , thickness, cv2.LINE_AA) 
		#cv2.waitKey(100)
	window_name = 'img'
	# add window setting to full screen,show middle of screen
	cv2.namedWindow(window_name, cv2.WND_PROP_FULLSCREEN)
	cv2.moveWindow(window_name, screen.x - 1, screen.y - 1)
	cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN,cv2.WINDOW_FULLSCREEN)
	cv2.imshow(window_name,img)#show frame
	cv2.waitKey(1);#automatically close
	if sampleNum > 20:#if more than 20 images
		print('User.'+str(uid)+'.')
		break#halt
cap.release()#release camera

conn.commit()#anchor sqlite to stop using it

conn.close()#quit connection with sqlite
cv2.destroyAllWindows()#cv close windows