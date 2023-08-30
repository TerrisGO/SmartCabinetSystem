Make sure xampp/mysql,
Node.js v14.16.1 and Python version 3.6.7 was installed

First step run the phpmyadmin to create new db in mysql name "test"
then import database file >>>test.sql 
look images in \z_img_read_me

*(install nodemon and babel)*
npm install -g --save-dev nodemon
npm install -g babel-cli --save
npm install -g babel-preset-env --save
npm install -g babel-preset-env --save
_______________________________________________________________________________________
***Backend*** 
- dependecies install (require babel and nodemon)
(if "node_modules" folder in \backend exists and contains dependecies files
skip to step 5&)
1.open new CMD prompt
2.>>cd D:\path_link\FYP_Final_version\backend
3.>>node js install package.json --save
4.After done installed 
5&.run with >>>nodemon --exec babel-node src/index.js
_______________________________________________________________________________________
***Client*** 
- dependecies install (require nodemon and Internet connection)
(if "node_modules" folder in \client exists and contains dependecies files
skip to step 6#)
1.open new CMD prompt
2.>>cd D:\path_link\FYP_Final_version\client
3.>>node js install package.json --save
^4.(Optional) Change the username in .env file (simulate different location)
5.After done installed 
6#.run with >>>nodemon start
7. open browser navigate to link >>localhost:3000

!(In case the Stripe Payment not working check internet connection
Else have to login to the https://dashboard.stripe.com/login
create new Publicn key and Private key to replace)
_______________________________________________________________________________________
***Client Python*** 
- dependecies install for python
pip install Pillow
pip install screeninfo
pip install numpy
pip install opencv-python
pip install tensorflow
pip install imutils
pip install keras
pip install scipy--1.0.0
pip install opencv-contrib-python
1.Install all Python dependencies
   check if sqlite_database.db file exist on 
2.(If sqlite_database.db not exist)
run >> cd D:\path_link\FYP_Final_version\client\python
    >> python create_label_database.py
(Not require run the others Python files/ it will get call by nodejs Client)
_______________________________________________________________________________________
***Staff*** 
- dependecies install
(if "node_modules" folder in \staff exists and contains dependecies files
skip to step 5@)
1.open new CMD prompt
2.>>cd D:\path_link\FYP_Final_version\staff
3.>>node js install package.json --save
4.After done installed 
5@.run with >>>node index.js
6. open browser navigate to link >>localhost:5000
7.register new account Or login with
  >>username:test@gmail.com
  >>password:test123
_______________________________________________________________________________________
_______________________________________________________________________________________
*Admin # NOT IMPORTANT
The admin api is running with the backend code
require using the Postman or any REST debugging software
https://www.postman.com/downloads/
to sent request to the server <<localhost:3000/+/Endpoint_link>>

Usage info  |   HTTP Method  |   End Point  |  <x> param(s) or values(JSON)
<Create new admin>
POST/api/admin/create
{   
    "firstname":"any_string",
    "lastname" :"any_string",
    "username" :"any_string",
    "role":"number",
    "email" :"any_string",
    "password":"any_string"
}

<Admin login>
POST/api/admin/login
{
 "email":"any_string",
 "password":"any_string"
}

<search admin with ID>
GET/api/admin/:userId(Number)

<UPDATE admin detail>
PUT/api/admin/update
{
    firstname:"any_string",
    lastname:"any_string",
    role:"number(1/4/8)",
    password:"any_string"
}

<Delete Admin with ID>
DELETE/api/admin/:userId(Number)

<search current admin Info>
GET/api/adminselfinfo

<List all staffs>
GET/api/staff

<search staff by ID>
GET/api/staff/:Id(Number)

<Retrive all box_servicing records>
GET/api/boxservicing

<search box servicing record with ID>
GET/api/boxservicing/:Id(Number)

<retrieve all transfer allocation records>
GET /api/transfer_allocation

<search a transfer allocation record with ID>
GET/api/transfer_allocation/:Id

<retrieve all boxes>
GET/api/boxes

<search a box detail with id>
GET/api/box/:Id(Number)

<retrieve all CABINET SET>
GET/api/cabinet_set

<search cabinet set detail with ID>
GET/api/cabinet_set/:userId(Number)

<Create new cabinet set>
POST/api/cabinet_set/create_cabinetset
{
    "location_name":"any_string",
    "gpslocation":"any_string",
    "totalboxs":"number",
    "cabinet_addr":"any_string",
    "cabinet_pass":"any_string",
    "hardware_detail":"any_string"
}

<Create new box associate with (exist)cabinet_set>
POST/api/cabinet_set/createbox
{
  "cabinet_fk":"Existing Cabinet ID(Number)"
}

<Update the cabinetset Details>
PUT/api/cabinet_set/update_cabinetset
{
 "location_name:"any_string",
 "gpslocation:"any_string", 
 "totalboxs":"Number",
 "cabinet_addr":"any_string",
 "cabinet_pass":"any_string",
 "hardware_detail":"any_string",
 "cabinet_id":"Number"
}

<Update staff Details>
PUT/api/cabinet_set/update_staff
{
"staff_name":"any_string",
"staff_email":"any_string",
"staff_pass":"any_string",
"staff_phone":"10_numbers",
"staff_addr":"any_string",
"duty_status":"Online/Offline"
}

<Update box details>
PUT/api/cabinet_set/update_box
{
  "box_id":"Exist box ID(Number)", 
  "cabinet_fk":"Exist cabinet_set ID(Number)"
}

