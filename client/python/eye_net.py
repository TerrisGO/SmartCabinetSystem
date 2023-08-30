import os
from PIL import Image
import numpy as np
import keras
from keras.models import Sequential
from keras.layers import Conv2D
from keras.layers import AveragePooling2D
from keras.layers import Flatten
from keras.layers import Dense
from keras.models import model_from_json
from keras.preprocessing.image import ImageDataGenerator
from keras import backend as K
from pathlib import Path
from scipy.ndimage import imread
from scipy.misc import imresize, imsave
p = Path()
IMG_SIZE = 24
absolutepath = str(p.absolute())#"D:/Sem7/client/real_client/node-website-master/python/"
absolutepathx = absolutepath.replace('\\', '/')+'/python'

def collect():
	train_datagen = ImageDataGenerator(
			rescale=1./255,
			shear_range=0.2,
			horizontal_flip=True, 
		)

	val_datagen = ImageDataGenerator(
			rescale=1./255,
			shear_range=0.2,
			horizontal_flip=True,		)

	train_generator = train_datagen.flow_from_directory(
	    directory="dataset/train",
	    target_size=(IMG_SIZE, IMG_SIZE),
	    color_mode="grayscale",
	    batch_size=32,
	    class_mode="binary",
	    shuffle=True,
	    seed=42
	)

	val_generator = val_datagen.flow_from_directory(
	    directory="dataset/val",
	    target_size=(IMG_SIZE, IMG_SIZE),
	    color_mode="grayscale",
	    batch_size=32,
	    class_mode="binary",
	    shuffle=True,
	    seed=42
	)
	return train_generator, val_generator


def save_model(model):
	model_json = model.to_json()
	with open(absolutepathx +"/eye_model/model.json", "w") as json_file:
		json_file.write(model_json)
	# serialize weights to HDF5
	model.save_weights("/eye_model/model.h5")

def load_model():
	json_file = open(absolutepathx +'/eye_model/model.json', 'r')#find model.json
	loaded_model_json = json_file.read()#copy to this variable
	json_file.close()#close the file after read
	#Parses a JSON model configuration string and returns a model instance
	loaded_model = model_from_json(loaded_model_json)
	# load weights into new model
	loaded_model.load_weights(absolutepathx +"/eye_model/model.h5")#load the weight files.
	#complie the model
	loaded_model.compile(loss='binary_crossentropy', optimizer='adam', metrics=['accuracy'])
	return loaded_model

def train(train_generator, val_generator):
	STEP_SIZE_TRAIN=train_generator.n//train_generator.batch_size
	STEP_SIZE_VALID=val_generator.n//val_generator.batch_size

	print('[LOG] Intialize Neural Network')
	
	model = Sequential()

	model.add(Conv2D(filters=6, kernel_size=(3, 3), activation='relu', input_shape=(IMG_SIZE,IMG_SIZE,1)))
	model.add(AveragePooling2D())

	model.add(Conv2D(filters=16, kernel_size=(3, 3), activation='relu'))
	model.add(AveragePooling2D())

	model.add(Flatten())

	model.add(Dense(units=120, activation='relu'))

	model.add(Dense(units=84, activation='relu'))

	model.add(Dense(units=1, activation = 'sigmoid'))

	#print(model.summary())
	model.compile(loss='binary_crossentropy', optimizer='adam', metrics=['accuracy'])

	model.fit(generator=train_generator,
	                    steps_per_epoch=STEP_SIZE_TRAIN,
	                    validation_data=val_generator,
	                    validation_steps=STEP_SIZE_VALID,
	                    epochs=20
	)
	save_model(model)

def predict(img, model):
	img = Image.fromarray(img, 'RGB').convert('L')#convert to grey scale
	img = imresize(img, (IMG_SIZE,IMG_SIZE)).astype('float32')#resize to 24x24
	img /= 255 #only allow 0 - 255 value
	img = img.reshape(1,IMG_SIZE,IMG_SIZE,1)#configure the input shape array
	prediction = model.predict(img)#call model predict to predict the class of image
	if prediction < 0.1:
		prediction = 'closed'#eye is probaly closed
	elif prediction > 0.9:
		prediction = 'open'#eye is probaly opening
	else:
		prediction = 'idk'#unknow state
	return prediction

def evaluate(X_test, y_test):
	model = load_model()
	print('Evaluate model')
	loss, acc = model.evaluate(X_test, y_test, verbose = 0)
	print(acc * 100)

if __name__ == '__main__':	
	train_generator , val_generator = collect()
	train(train_generator,val_generator)
