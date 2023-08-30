import os#import operating system
import cv2#import opencv
#import face_recognition
import numpy as np
from collections import defaultdict#an unordered collection of data
# values that are used to store data values like a map.
from imutils.video import VideoStream#used to capture frame
from eye_net import * #import all functions from eye_net
import sqlite3#require sqlite
from pathlib import Path#require to read file path 

#font setting
font = cv2.FONT_HERSHEY_SIMPLEX
text = "Press Q to Exit"
text2 = "Face Recognition"
text3 ="please blinks slowly"
text4 ="Allow only one person's face"
# get boundary of this text
textsize = cv2.getTextSize(text, font, 1, 2)[0]
#font setting end
p = Path()

absolutepath = str(p.absolute())#"D:/Sem7/client/real_client/node-website-master/python/"
absolutepathx = absolutepath.replace('\\', '/')+'/python'#require file path in /python folder
conn = sqlite3.connect(absolutepathx+'/sqlite_database.db')#require sqlite db
c = conn.cursor()#define sqlite cursor

fname = absolutepathx+"/lbph_recognizer/trainingData.yml"#require trained LBPH file
if not os.path.isfile(fname):#if file does not found
    print("Please train the data first> absolutepath"+absolutepathx)
    exit(0)#exit if trainingData.xml not found
recognizer = cv2.face.LBPHFaceRecognizer_create()#Initialize LBPH Recognizer
recognizer.read(fname)#read all lable name

def init():
    face_cascPath = absolutepathx+'/haar_features/haarcascade_frontalface_alt.xml'
    open_eye_cascPath = absolutepathx+'/haar_features/haarcascade_eye_tree_eyeglasses.xml'
    left_eye_cascPath = absolutepathx+'/haar_features/haarcascade_lefteye_2splits.xml'
    right_eye_cascPath =absolutepathx+'/haar_features/haarcascade_righteye_2splits.xml'
    #print("right_eye_cascPath >" +right_eye_cascPath)
    face_detector = cv2.CascadeClassifier(face_cascPath)
    open_eyes_detector = cv2.CascadeClassifier(open_eye_cascPath)
    left_eye_detector = cv2.CascadeClassifier(left_eye_cascPath)
    right_eye_detector = cv2.CascadeClassifier(right_eye_cascPath)

    #print("[LOG] Opening webcam ...")
    video_capture = VideoStream(src=0).start()#start capturing

    model = load_model()#load the model from eye_net.py

    return (model,face_detector, open_eyes_detector, left_eye_detector,right_eye_detector, video_capture) 

def isBlinking(history, max_Frames):
    # checking eye closed-open-closed pattern normal pattern 111 /have openclose 101
    for i in range(max_Frames):
        pattern_ = '1' + '0'*(i+1) + '1'
        if pattern_ in history:
            return True
    return False

def detect_and_display(model, video_capture, face_detector, open_eyes_detector, left_eye_detector, right_eye_detector, eyes_detected):
        frame = video_capture.read()#fetch existing image to value frame
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)#convert to grayscale
        # resize the frame
        # Detect faces
        faces = face_detector.detectMultiScale(
            gray,
            scaleFactor=1.2,
            minNeighbors=5,
            minSize=(50, 50),
            flags=cv2.CASCADE_SCALE_IMAGE
        )

        # for each detected face
        for (x,y,w,h) in faces:
            # draw rectangle to face
            cv2.rectangle(frame,(x,y),(x+w,y+h),(0,255,0),3)
            #using LBPH recognitzer to predict image ID and return confidence
            ids,conf = recognizer.predict(gray[y:y+h,x:x+w])
            #fetch the labels (for lbph facial recognition)
            c.execute("select name from users where id = (?);", (ids,))
            result = c.fetchall()#fetch all available labels in sqlite db
            name = result[0][0]#save exist name labels to variable name

            eyes = []#define eyes array
            face = frame[y:y+h,x:x+w]#define position of face with color
            gray_face = gray[y:y+h,x:x+w]#define position of face without color
            # Eyes detection
            # check if eyes are open (with glasses taking into account)
            open_eyes_glasses = open_eyes_detector.detectMultiScale(
                gray_face,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30),
                flags = cv2.CASCADE_SCALE_IMAGE
            )
            # if open_eyes_glasses cascade detected eyes then they are open 
            if len(open_eyes_glasses) == 2:
                eyes_detected[name]+='1'
                for (ex,ey,ew,eh) in open_eyes_glasses:
                    cv2.rectangle(face,(ex,ey),(ex+ew,ey+eh),(0,255,0),2)
            
            # otherwise try detecting eyes using left and right_eye_detector
            # which can detect open and closed eyes                
            else:
                # separate the face into left and right sides
                left_face = frame[y:y+h, x+int(w/2):x+w]
                left_face_gray = gray[y:y+h, x+int(w/2):x+w]

                right_face = frame[y:y+h, x:x+int(w/2)]
                right_face_gray = gray[y:y+h, x:x+int(w/2)]

                # Detect the left eye
                left_eye = left_eye_detector.detectMultiScale(
                    left_face_gray,
                    scaleFactor=1.1,
                    minNeighbors=5,
                    minSize=(30, 30),
                    flags = cv2.CASCADE_SCALE_IMAGE
                )

                # Detect the right eye
                right_eye = right_eye_detector.detectMultiScale(
                    right_face_gray,
                    scaleFactor=1.1,
                    minNeighbors=5,
                    minSize=(30, 30),
                    flags = cv2.CASCADE_SCALE_IMAGE
                )

                eye_status = '1' # assume the eyes are open

                # For each eye check wether the eye is closed.
                # If one is closed we conclude the eyes are closed
                for (ex,ey,ew,eh) in right_eye:
                    color = (0,255,0)#green color
                    pred = predict(right_face[ey:ey+eh,ex:ex+ew],model)
                    if pred == 'closed':#eye_net predict closing eye for right eye
                        eye_status='0'
                        color = (0,0,255)#red color
                    cv2.rectangle(right_face,(ex,ey),(ex+ew,ey+eh),color,2)#draw rectangle
                for (ex,ey,ew,eh) in left_eye:
                    color = (0,255,0)#green color
                    pred = predict(left_face[ey:ey+eh,ex:ex+ew],model)
                    if pred == 'closed':#eye_net predict closing eye for left eye
                        eye_status='0'
                        color = (0,0,255)#red color
                    cv2.rectangle(left_face,(ex,ey),(ex+ew,ey+eh),color,2)#draw rectangle
                eyes_detected[name] += eye_status

            count_faces=str(len(faces))#cout number of face(s)
            cv2.putText(frame, count_faces, (x, y+10), cv2.FONT_HERSHEY_SIMPLEX,0.75, (0, 255, 0), 2)

            # Check, if the eye has blinked
            # If yes, echo the User.ID(label)
            if (isBlinking(eyes_detected[name],3) and conf < 50 and count_faces == '1'):
                print('User.'+str(ids)+'.')#print the lable id
                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                # Display name
                y = y - 15 if y - 15 > 15 else y + 15
                cv2.putText(frame, name, (x, y), cv2.FONT_HERSHEY_SIMPLEX,0.75, (0, 255, 0), 2)
                exit(0)

        return frame


if __name__ == "__main__":
    (model, face_detector, open_eyes_detector,left_eye_detector,right_eye_detector, video_capture) = init()
    #data = process_and_encode(images)
    
    eyes_detected = defaultdict(str)#set variable to dictionary type
    while True:
        frame = detect_and_display(model, video_capture, face_detector, open_eyes_detector,left_eye_detector,right_eye_detector, eyes_detected)
        textX = int((frame.shape[1] - textsize[0]) / 2)
        textY = int((frame.shape[0] + textsize[1]) / 2 + 190)
        textY2 = int((frame.shape[0] + textsize[1]) / 2 - 190)
        textY3 = int((frame.shape[0] + textsize[1]) / 2 - 169)
        textX3 = int((frame.shape[1] - textsize[0]) / 2 - 25)
        textX4 = int((frame.shape[1] - textsize[0]) / 2 - 100)
        textY4 = int((frame.shape[0] - textsize[1]) / 2 + 150)
        #text position settings
        # add text centered on image
        cv2.putText(frame, text, (textX, textY ), font, 1, (255, 255, 255), 2)
        cv2.putText(frame, text2, (textX, textY2 ), font, 1, (255, 255, 255), 2)
        cv2.putText(frame, text3, (textX3, textY3 ), font, 1, (255, 255, 255), 2)
        cv2.putText(frame, text4, (textX4, textY4), font, 1, (255, 255, 255), 2)
        cv2.namedWindow("Face Liveness Detector", cv2.WND_PROP_FULLSCREEN)
        cv2.setWindowProperty("Face Liveness Detector",cv2.WND_PROP_FULLSCREEN,cv2.WINDOW_FULLSCREEN)
        cv2.imshow("Face Liveness Detector", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    cv2.destroyAllWindows()
    video_capture.stop()