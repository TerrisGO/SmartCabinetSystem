import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import models from '../models';
import QRCode from 'qrcode';

const dbConnection = require('../controllers/clientdb');//Using raw query
const cryptoRandomString = require('crypto-random-string');
const nodemailer = require("nodemailer");// for implementing mail feature
const Client_ = models.cabinet_set;
let secret_ = process.env.SECRET || "SECERT";

// load input validation
import validateLoginClientForm from '../validation/clientlogin';
import validateUnlockBeforeTransfer from '../validation/v_unlockbeforetransfer';
import validateUnlockAfterTransfer from '../validation/v_unlockaftertransfer';
import validateBoxItselfReserve from '../validation/v_box_itself_reserve';
import validateCancelReservedBox from '../validation/v_cancel_reserved_box';
import validateConfirmPayment from '../validation/v_confirm_payment';

/*node mailer values */
const backendemail =process.env.EMAILADDR;
const backendmailpass = process.env.EMAILPASS;

let transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: backendemail, 
    pass: backendmailpass, 
  },
});

//for the client authentication
const login = (req, res) => {
  const { errors, isValid } = validateLoginClientForm(req.body);

  // check validation
  if(!isValid) {
    return res.status(400).json(errors);
  }

  const { location_name, password } = req.body;
  console.log(location_name);
  console.log("Client_ "+Client_);
  Client_.findAll({ 
    where: { 
      location_name :req.body.location_name
    } 
  })
  .then(client => {

    //check for client
    if (!client.length) {
      errors.location_name = 'client not found!';
      return res.status(404).json(errors);
    }
     
    let originalPassword = client[0].dataValues.cabinet_pass

    //check for password
    bcrypt
      .compare(password, originalPassword)
      .then(isMatch => {
        if (isMatch) {
          // client matched
          console.log('matched!')
          const { cabinet_id, location_name } = client[0].dataValues;
          const payload = { cabinet_id, location_name }; //jwt payload
          // console.log(payload)

          jwt.sign(payload, secret_, { 
            expiresIn: 86400 //24 hours
          }, (err, token) => {
            res.json({
              success: true,
              token: 'Bearer ' + token,
              address: client[0].dataValues.cabinet_addr
            });
          });
        } else {
          errors.password = 'Password not correct';
          return res.status(400).json(errors);
        }
    }).catch(err => console.log(err));
  }).catch(err => res.status(500).json({err}));
};

// fetch all client crendential
const findAllClient = (req, res) => {
  Client_.findAll()
    .then(client => {
      res.json({ client });
    })
    .catch(err => res.status(500).json({ err }));
};

//create new record after payment was made
const confirm_payment =  (req, res) => {
  const { errors, isValid } = validateConfirmPayment(req.body);

  // check validation
  if(!isValid) {
    return res.status(400).json(errors);
  }
  var customerEmail    = req.body.customerEmail; 
  var customerPhone    = req.body.customerPhone;
  var storingDay       = req.body.storingDay;
  var storingHours     = req.body.storingHours;
  var payAmount        = req.body.payAmount;
  var localBid         = req.body.localBid;
  var targetBid        = req.body.targetBid;
  var serviceType      = req.body.serviceType;
  var faceScannQr      = req.body.faceScannQr;
  var face_recFilename = req.body.face_recFilename;
  console.log("body req: "+JSON.stringify(req.body));
  var currentSessionID = getTokenID(req.headers.authorization);
  var placehoders; 
  var query;
  console.log(JSON.stringify(req.body));

    if (serviceType == "L_S"){ //checkService Type Local_Storing or Transfer_Storing
      placehoders = [localBid,currentSessionID];
      query = "SELECT `box_id` FROM `boxes` WHERE `box_id`=? AND `cabinet_fk` = ? AND `self_reserving` = 1";
    }else if (serviceType == "T_S"){
      placehoders = [targetBid,localBid,currentSessionID];
      query = "SELECT B.`box_id` as targetboxid, A.`box_id` as localbox FROM `boxes` as B INNER JOIN `boxes` AS A ON A.`box_id` = B.`reservedbyother_box_f_k`	 WHERE B.`box_id` =? AND B.`reservedbyother_box_f_k` = ? AND A.`cabinet_fk`=? AND A.`self_reserving`=1";
    }
   //need to add query check whether is reserved then only insert/update record
    dbConnection.execute(query
      ,placehoders)
      .then(([rows]) => {
        console.log("Running query> "+query)
        if (rows.length > 0){
          console.log("Found ");
          
          //INSERT into box_servicing details
          insertNewService(localBid,targetBid,customerEmail,customerPhone,
            payAmount,serviceType,faceScannQr,storingDay,storingHours, res);

          if (serviceType == "L_S"){ //checkService Type Local_Storing or Transfer_Storing
            updateBoxAvailableStatus1(localBid,currentSessionID,face_recFilename);
          }else if (serviceType == "T_S"){
            updateBoxAvailableStatus1(localBid,currentSessionID,"");
            updateBoxAvailableStatus2(targetBid,localBid,currentSessionID);
          }
        }else{
          res.status(200).json({ 
            insertNewService:'Error',
            msg:'record not insertting'
         });
        }
      }).catch(err => {
          if (err) throw err;
          if (err){
            console.log('Error during inserting row to insertNewService');
          }
      });
};

//after payment success insert servicing row
function insertNewService(vlocalbox_fkid,vtargetbox_fkid,vusr_email, vusr_phone,
                          vpaid_amount, vservice_type, vunlock_method, 
                          vstore_days, vstore_hours, res){
  /*console.log("vlocalbox_fkid "+vlocalbox_fkid + "vtargetbox_fkid "+vtargetbox_fkid+
  " vusr_email: "+ vusr_email + " vusr_phone: "+ vusr_phone, " vpaid_amount: "+ vpaid_amount+
  " vservice_type: "+ vservice_type +" vunlock_method: "+  vunlock_method, 
  " vstore_days: "+ vstore_days+" vstore_hours: "+ vstore_hours);
  */
  console.log("days "+Number(vstore_days)+" "+typeof Number(vstore_days)+
              " hours "+Number(vstore_hours)+" "+typeof Number(vstore_hours));
  var vvtboxid = vtargetbox_fkid;
  var numday = Number(vstore_days);
  var numhrs = Number(vstore_hours);
  var placehoders;
  var query;
  if (vtargetbox_fkid ==""){
    placehoders =[vlocalbox_fkid, numday, numhrs,vusr_email,
                  vusr_phone, vpaid_amount, vservice_type, vunlock_method, 
                  vstore_hours, vstore_days];
    query = "INSERT INTO `box_servicing`(`localbox_fkid`, `start_datetime`, `expire_datetime`,`targetbox_fkid`, `usr_email`, `usr_phone`, `paid_amount`, `service_type`, `unlock_method`, `store_hours`, `store_days` ) VALUES (?,now(),NOW()+INTERVAL ? DAY +INTERVAL ? HOUR ,NULL,?,?,?,?,?,?,?)";
  }else{
    placehoders =[vlocalbox_fkid, numday, numhrs,vvtboxid,
                  vusr_email, vusr_phone, vpaid_amount, vservice_type,
                  vunlock_method, vstore_hours, vstore_days];
    query = "INSERT INTO `box_servicing`(`localbox_fkid`, `start_datetime`, `expire_datetime`,`targetbox_fkid`, `usr_email`, `usr_phone`, `paid_amount`, `service_type`, `unlock_method`, `store_hours`, `store_days` ) VALUES (?,now(),NOW()+INTERVAL ? DAY +INTERVAL ? HOUR ,?,?,?,?,?,?,?,?)";
  }

  //lbox,start_DT,expire_DT,tbox,email,phno,price,s_type,unlock_mtd,shours,sdays
  dbConnection.execute(query
    ,placehoders)
    .then(([rows]) => {
      if (rows.insertId != 0){
        console.log("New box_servicing row created >ID: "+rows.insertId);
        queryLatestInsertedServicingRow(rows.insertId,vservice_type,vunlock_method, res);
      }
    }).catch(err => {
        if (err) throw err;
        if (err){
          console.log('Error during inserting row to insertNewService');
          return undefined;
        }
    });
}

//for localbox to update customerQr and reserving status(R > Allocated)
function updateBoxAvailableStatus1(localBid,currentSessionID, face_recFilename){
  var randomHash = cryptoRandomString({length: 20, type: 'alphanumeric'});
  console.log("Running updateBoxAvailableStatus1");
  dbConnection.execute("UPDATE `boxes` SET `reserved_expire_datetime`=NULL, `available_status`='A',`customerpass_qr`=?, `facereg_filename`=? WHERE `box_id`=? AND `cabinet_fk`=? AND `available_status`='R' AND `self_reserving`= 1"
  ,[randomHash,face_recFilename, localBid, currentSessionID ])
  .then(([rows]) => { 
    console.log('Success updateBoxAvailableStatus1');
  }).catch(err => {
      if (err) throw err;
      if (err){
          console.log('Error during updateBoxAvailableStatus1');
      }
  });
}

//for targetbox to update customerQr and reserving status(R > Allocated)
function updateBoxAvailableStatus2(targetBid,localBid,currentSessionID){
  var randomHash = cryptoRandomString({length: 20, type: 'alphanumeric'});
  dbConnection.execute("UPDATE `boxes` SET `reserved_expire_datetime`=NULL, `available_status`='A',`customerpass_qr`=?  WHERE `box_id`=? AND `reservedbyother_box_f_k`=? AND `available_status`='R' AND `reserved_by_otherBox`=1 AND `cabinet_fk`!=?"
  ,[randomHash,targetBid,localBid,currentSessionID])
  .then(([rows]) => {
    console.log('Success updateBoxAvailableStatus2');
  }).catch(err => {
      if (err) throw err;
      if (err){
          console.log('Error during updateBoxAvailableStatus2');
      }
  });
}

//sent Mail to user after paid successfully //boxid1, locationAddr1, qrbox1, boxid2, locationAddr2, qrbox2, svType
async function mailing(boxid1,startTime,expireTime, locationAddr1, qrbox1, boxid2,
                       locationAddr2, qrbox2, svType, serviceID,customerEmail, paid_inv) {
  var targetReceiver ="yikyekgo@gmail.com" ;//debugger's mail
  if (typeof customerEmail !=='undefined'){
    targetReceiver = customerEmail;
  }
  var qR1 ={
    sid: serviceID,
    cqr: qrbox1
  };
  var qR2 ={
    sid: serviceID,
    cqr: qrbox2
  };
  let img = await QRCode.toDataURL(JSON.stringify(qR1)); //(Convert Json into Qr image)
  let img2 = await QRCode.toDataURL(JSON.stringify(qR2));//(Convert Json into Qr image)

  var htmlstruc = "From Smart Cabinet System";
  var txt ="Smart Cabinet QR access code please do not share to unknown parties";
  if (svType =="L_S"){
    htmlstruc = txt+'<br>'+'boxID: '+boxid1+' </br> QR for the box <img src="' + img +
                '"> Address for box: '+locationAddr1+'<br>Service start time: '+
                startTime +'<br>'+'Service expire at: '+expireTime+'<br>'+'Invoice payment(RM): '+paid_inv;
  }else if(svType =="T_S"){
    htmlstruc = txt+'<br>'+'1st boxID: '+boxid1+'<br> QR for the box <img src="' +
                img + '"><br> Address for firstbox: '+locationAddr1+'<br><br> 2nd boxID: '+
                boxid2+'<br> QR for Target box <img src="' + img2 +
                '"> <br>Address for Target box: '+locationAddr2+'<br>Service start time: '+
                startTime +'<br>'+'Service expire at: '+expireTime+'<br>'+'Invoice payment(RM): '+paid_inv;
  }
  // send mail with defined transport object
  let info = await transporter.sendMail({
    attachDataUrls: true,//to accept base64 content in messsage
    from: '"📪" <smartcabinetmalaysia.com>', // sender address
    to: targetReceiver, // list of receivers
    subject: "Hello ✔ From Smart Cabinet Malaysia", // Subject line
    text: "Smart Cabinet QR access code please do not share to unknown parties", // plain text body
    html: htmlstruc // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}

//findind the latest insert rows and send the mail to the person which the row included.
async function queryLatestInsertedServicingRow(servicingID,serviceType,vunlock_method, res){
  var query;console.log("Running queryLatestInsertedServicingRow"); 
  await new Promise(resolve => setTimeout(resolve, 5000));//wait for the time for update
  var requireTrain ="no";
  if (serviceType =="L_S"){
    query = "SELECT A.`localbox_fkid`, A.`usr_email`, A.`paid_amount`, A.`start_datetime`, A.`expire_datetime`, C.`customerpass_qr`, C.`facereg_filename`, C.`servo_pindetail` ,F.`cabinet_addr` FROM `box_servicing` AS A INNER JOIN `boxes` AS C ON C.`box_id` = A.`localbox_fkid` INNER JOIN `cabinet_set` AS F ON F.`cabinet_id` = C.`cabinet_fk` WHERE A.`service_id`=?";
    if (vunlock_method="FnQR"){
      requireTrain ="yes";
    }
  }else if(serviceType =="T_S"){
    query = "SELECT A.`localbox_fkid`,A.`usr_email`, A.`paid_amount`, A.`targetbox_fkid` ,A.`start_datetime`, A.`expire_datetime`, C.`customerpass_qr`, C.`facereg_filename`, C.`servo_pindetail`, D.`customerpass_qr` AS `customerpass_qr2` ,F.`cabinet_addr`, G.`cabinet_addr` AS `cabinet_addr2` FROM `box_servicing` AS A INNER JOIN `boxes` AS C ON C.`box_id` = A.`localbox_fkid` INNER JOIN `boxes` AS D ON D.`box_id` = A.`targetbox_fkid` INNER JOIN `cabinet_set` AS F ON F.`cabinet_id` = C.`cabinet_fk` INNER JOIN `cabinet_set` AS G ON G.`cabinet_id` = D.`cabinet_fk` WHERE A.`service_id`=?";
  }
  if (query !=="undefined"){
    dbConnection.execute(query
      ,[servicingID])
      .then(([rows]) => {
        if (rows.length > 0){
          var boxid1 = (typeof rows[0].localbox_fkid !== 'undefined') ? rows[0].localbox_fkid : "";
          var boxid1location = (typeof rows[0].cabinet_addr !== 'undefined') ? rows[0].cabinet_addr : "";
          var boxid1QR =(typeof rows[0].customerpass_qr !== 'undefined') ? rows[0].customerpass_qr: "";
          var boxid2 = (typeof rows[0].targetbox_fkid !== 'undefined') ? rows[0].targetbox_fkid : "";
          var boxid2location = (typeof rows[0].cabinet_addr2 !== 'undefined') ? rows[0].cabinet_addr2 : "";
          var boxid2QR =(typeof rows[0].customerpass_qr2 !== 'undefined') ? rows[0].customerpass_qr2: "";
          var customerEmail =(typeof rows[0].usr_email !== 'undefined') ? rows[0].usr_email: "";
          var paid_inv = (typeof rows[0].paid_amount !== 'undefined') ? rows[0].paid_amount: "0";
          mailing(boxid1, rows[0].start_datetime, rows[0].expire_datetime, boxid1location,
            boxid1QR, boxid2, boxid2location, boxid2QR, serviceType,
            servicingID,customerEmail, paid_inv).catch(console.error);
          res.status(200).json({ //NEED ADD RESPOSNE over Here
            validation:'yes',
            gpiopin: rows[0].servo_pindetail,
            boxid : rows[0].localbox_fkid,
            trainFace : requireTrain,
            frecogfilename : rows[0].facereg_filename
           });
        }
      }).catch(err => {
          if (err) throw err;
          if (err){
            console.log('Error during queryLatestInsertedServicingRow');
          }
      });
  }
}

//find the match qr code for customer to unlock
const unlockforcustomer = (req, res) => {
  console.log(req.body);
  var serviceId = ( req.body.serviceId !== undefined) ? req.body.serviceId : "null";
  var boxId= ( req.body.boxId !== undefined) ? req.body.boxId : "null";
  var customerQr  = ( req.body.customerQr !== undefined) ? req.body.customerQr : "null";
  console.log("req.body.serviceId "+req.body.serviceId);
  console.log("req.body.boxId "+req.body.boxId);
  console.log("req.body.customerQr "+req.body.customerQr);
  var querycustomerQR = "select A.`service_id`, A.`expire_datetime`, B.`servo_pindetail`, B.`box_id` from box_servicing A inner join boxes B on A.`localbox_fkid` = B.`box_id` or A.`targetbox_fkid` = B.`box_id` WHERE A.`service_id` = ? AND A.`expire_datetime` >= NOW() AND B.`box_id` =? AND B.`customerpass_qr`=? limit 1";
  dbConnection.execute(querycustomerQR
    ,[serviceId, boxId, customerQr])
    .then(([rows]) => {
      if (rows !== 'undefined' && customerQr !==""){
          console.log("unlockforcustomer runned once");
          console.log(rows[0].service_id);
          //console.log(transferID_);
          //return rows[0];
            res.status(200).json({ 
            validation:'yes',
            expiration: rows[0].expire_datetime,
            gpiopin: rows[0].servo_pindetail,
            boxid : rows[0].box_id
           });
      }else{console.log('No record in result or Error during Method querycustomerQR');}
  }).catch(err => 
    res.status(200).json({ 
      validation:'no',
      msg:'record not found'
   }));
};

//find the match label string from facial recognition result for customer to unlock
const unlockforcustomerwithface = (req, res) => {
  console.log(req.body);
  console.log("runing unlockforcustomerwithface ");
 
  var boxId=( req.body.boxId !== undefined) ? req.body.boxId : "";
  var labelstr= ( req.body.labelString !== undefined) ? req.body.labelString : "";
  var labelstrrmovelinebreak = labelstr.replace(/(\r\n|\n|\r)/gm, "");
  console.log("boxId: "+boxId+" labelremovedlinebreak: "+  labelstrrmovelinebreak);

  var querycustomerFace = "select A.`service_id`, A.`expire_datetime`, B.`servo_pindetail`, B.`box_id`,B.`facereg_filename` from box_servicing A inner join boxes B on A.`localbox_fkid` = B.`box_id` or A.`targetbox_fkid` = B.`box_id` WHERE A.`expire_datetime` >= NOW() AND B.`box_id` =? AND B.`facereg_filename`LIKE ? ORDER BY A.`service_id` DESC limit 1";
  dbConnection.execute(querycustomerFace
    ,[boxId ,labelstrrmovelinebreak ])//labelstrrmovelinebreak
    .then(([rows]) => {
      console.log("rows.length:" +rows.length);
      if (rows !== 'undefined'){
          console.log("unlockforcustomerwithface runned once");
          console.log(rows[0].service_id);
          //console.log(transferID_);
          //return rows[0];
            res.status(200).json({ 
            validation:'yes',
            expiration: rows[0].expire_datetime,
            gpiopin: rows[0].servo_pindetail,
            boxid : rows[0].box_id
           });
      }else{console.log('No record in result or Error during Method querycustomerFace');}
  }).catch(err => 
    res.status(200).json({ 
      validation:'no',
      msg:'record not found'
   }));
};

//unlock before transfer  (check staff taking parcel and allow unlock the box)
const unlockbeforetransfer = (req, res) => {
  const { errors, isValid } = validateUnlockBeforeTransfer(req.body);
  // check validation
  if(!isValid) {
    return res.status(400).json(errors);
  }
  var tid = req.body.tid;
  var bqr= req.body.bqr;
  var bid  = req.body.bid;
  console.log("tid "+tid +" bqr "+bqr +" bid "+bid);
  //transferID, BEFORE_QR, boxID
  var querybeforetransferQR = "select A.`service_id`, A.`expire_datetime`, B.`servo_pindetail`, B.`box_id`, T.`transfer_status`, T.`acquire_id` from box_servicing A inner join boxes B on A.`localbox_fkid` = B.`box_id`  inner join transfer_allocation T on A.`service_id` = T.`box_servicing_fk` WHERE T.`acquire_id` = ?  AND B.`box_id` =? AND B.`staffpass_qr`=? AND T.`complete_time` IS NULL AND A.`transfer_complete` ='0' limit 1"; //removed AND A.`expire_datetime` >= NOW()
  dbConnection.execute(querybeforetransferQR
    ,[ tid, bid, bqr ])
    .then(([rows]) => {
      console.log("output> "+JSON.stringify([rows]));
      if (rows.length > 0 && bqr !=="" && rows[0].transfer_status =="Pending"){
          //check if the row exist in record
          console.log("unlockfor before transfer runned once");

            //update trasnfer handling time  on Transfer allocation table
            updateTrasnferHandlingSetTime(tid); 
            res.status(200).json({ 
            validation:'yes',
            expiration: rows[0].expire_datetime,
            gpiopin: rows[0].servo_pindetail,
            boxid : rows[0].box_id
           });
      }else{
        res.status(200).json({ 
          validation:'no',
          msg:'record not found'
        });
      }
  }).catch(err => 
    res.status(200).json({ 
      validation:'no',
      msg:'record not found'
   }));
};

//unlock after transfer (allow staff unlock the box and placing the parcel)
const unlockaftertransfer = (req, res) => {
  const { errors, isValid } = validateUnlockAfterTransfer(req.body);

  // check validation
  if(!isValid) {
    return res.status(400).json(errors);
  }
  var tid = req.body.tid;
  var aqr = req.body.aqr;
  var bid  = req.body.bid;
  //transferID, AFTER_QR, boxID
  var queryaftertransferQR = "select A.`service_id`,TIMESTAMPDIFF(HOUR,now(),A.`expire_datetime`) as difference_in_hours, A.`localbox_fkid` , A.`expire_datetime`, A.`usr_email`, B1.`box_id` as bid1, B2.`servo_pindetail`, B2.`box_id` as bid2, T.`transfer_status`, T.`acquire_id`, C1.`location_name` as locationA, C1.`cabinet_addr` as boxAaddr, C2.`location_name` as locationB, C2.`cabinet_addr` as boxBaddr from box_servicing A inner join boxes B1 on A.`localbox_fkid` = B1.`box_id` inner join boxes B2 on A.`targetbox_fkid` = B2.`box_id` inner join transfer_allocation T on A.`service_id` = T.`box_servicing_fk` inner join cabinet_set C1 on B1.`cabinet_fk` = C1.`cabinet_id` inner join cabinet_set C2 on B2.`cabinet_fk` = C2.`cabinet_id` WHERE T.`acquire_id` = ? AND B2.`box_id` =? AND B2.`staffpass_qr`=? AND T.`handling_time` IS NOT NULL AND T.`complete_time` IS NULL AND A.`transfer_complete` ='0' limit 1";
  dbConnection.execute(queryaftertransferQR
    ,[tid, bid, aqr])
    .then(([rows]) => {
      console.log("output> "+JSON.stringify([rows]));
      
      if (rows.length > 0 && aqr !=="" && rows[0].transfer_status =="Pending"){
          console.log("unlockfor after transfer runned once");
          //console.log(rows[0].service_id);          
            var lateYesNo = "no";console.log("difference_in_hours :"+rows[0].difference_in_hours);
            ///call to Update transfer_allocation SET complete_time
            //if false update new expiretime (Update the time add 2 more hours)
            if(Number(rows[0].difference_in_hours) > 1){ 
                console.log("Not late :"+rows[0].difference_in_hours);
                //Call to update the box_servicing Transfer status to Success
                setTransferCompleteOnBoxServ(rows[0].service_id, lateYesNo);  
             }else{
                lateYesNo = "Yes";
                console.log("Been late :"+lateYesNo);
                //Call to update the box_servicing Transfer status to Success
                setTransferCompleteOnBoxServ(rows[0].service_id, lateYesNo);
             }
                    
            setTransferCompleteOn_TAllocation(tid);
          
            //Sent mail to user that parcel was sent
            ///call send_mail to customer that the parcel was reached to the destintion
            NotifyEmailforParcelReached(rows[0].serviceID, rows[0].usr_email, rows[0].expire_datetime,
                                        rows[0].locationA, rows[0].bid1, rows[0].boxAaddr,
                                        rows[0].locationB, rows[0].bid2, rows[0].boxBaddr,
                                        lateYesNo).catch(console.error);

            setEmptytoLocalBox(rows[0].localbox_fkid); //set the localbox available status to (E)mpty
            settargetboxtoSelfReserve(rows[0].bid2); // set targetbox to self reserve
            
            res.status(200).json({ 
            validation:'yes',
            expiration: rows[0].expire_datetime,
            gpiopin: rows[0].servo_pindetail,
            boxid : rows[0].bid2
           });
      }else{
        res.status(200).json({ 
          validation:'no',
          msg:'record not found'
        });
      }
    }).catch(err => 
      res.status(200).json({ 
        validation:'no',
        msg:'record not found'
    }));
};

//box_itself_reserve
const box_itself_reserve = (req, res) => {
  const { errors, isValid } = validateBoxItselfReserve(req.body);
  // check validation
  if(!isValid) {
    return res.status(400).json(errors);
  }
  var boxID = (req.body.box_id !== undefined) ? req.body.box_id :"null" ;
  console.log("gathered boxID : "+boxID);
  if (boxID !=="null"){
    var currentSessionID = getTokenID(req.headers.authorization);
    dbConnection.execute("UPDATE `boxes` SET `available_status`='R',`self_reserving`='1', `reserved_expire_datetime`=now() +INTERVAL 8 MINUTE WHERE `box_id`=? AND `cabinet_fk`= ? AND `available_status`='E'"
    ,[boxID, currentSessionID])
    .then(([rows]) => {
      if (rows.affectedRows == 1){
        console.log('self reserving success'+ boxID);
        res.status(200).json({ 
          box_itself_reserve:'Yes',
          msg:'Reserved',
          boxid: boxID
        });
      }else{
        console.log('box_itself_reserve not reserving id');
        res.status(200).json({ 
          msg:'Failed'
        });
      }
    }).catch(err => {
        if (err) throw err;
        res.status(200).json({ 
          msg:'Failed'
        });
    });
  }
}

//box reserve anotherbox 
const box_reserve_another_box = async (req, res) => {
  var localbid  = req.body.localbid;
  var targetbid = req.body.targetbid;
  var currentSessionID = getTokenID(req.headers.authorization);
  var queryReserving = "";
  
  queryReserving = "UPDATE `boxes` SET `available_status`='R',`reserved_by_otherBox`='1',`reservedbyother_box_f_k`=?, `reserved_expire_datetime`=now() +INTERVAL 8 MINUTE WHERE `box_id`=? AND `cabinet_fk`<> ? AND `available_status`='E' AND EXISTS (SELECT `box_id` FROM `boxes` WHERE `box_id`= ? AND `available_status`='R' AND `self_reserving`='1' AND `cabinet_fk`= ?)";
  
  if (Number(localbid) && Number(targetbid)){
    dbConnection.execute(queryReserving
    ,[localbid,targetbid,currentSessionID, localbid , currentSessionID])
    .then(([rows]) => {
      if (rows.affectedRows == 1){
        res.status(200).json({ 
          box_reserve_another:'Yes',
          msg:'Reserved',
          boxid: targetbid
        });
      }else{
        res.status(200).json({ 
          msg:'Failed'
        });
      }
    }).catch(err => {
        if (err) throw err;
        res.status(200).json({ 
          msg:'Failed'
        });
    });
  }else{
    res.status(200).json({ 
      msg:'Failed'
    });
  }
}

//list of (E)mpty boxes for current cabinet client (FOR RESERVING & ALLOCATE)
const list_of_localCabinetboxess = (req, res) => {
  var currentCabinetID = getTokenID(req.headers.authorization);
  var querylistofBoxess = "SELECT `box_id` FROM `boxes` WHERE `cabinet_fk` =? AND `available_status` ='E'";
  dbConnection.execute(querylistofBoxess
    ,[currentCabinetID ])
    .then(([rows]) => {
      if (rows !== 'undefined'){
            res.status(200).json({ 
              rows
           });
      }else{console.log('No record in result or Error during Method list_of_boxess');}
  }).catch(err => 
    res.status(200).json({ 
      validation:'no',
      msg:'record not found',
   }));
};

//list of Allocated boxes for single cabinet set that to check (box service expire)
// whether the face recognition file still not expire/ if it does the files will get deleted
const list_of_faceFile_in_allocatedBox = (req, res) => {
  var currentCabinetID = getTokenID(req.headers.authorization);
  var querylistofBoxess = "SELECT `facereg_filename` FROM `boxes` WHERE `cabinet_fk` =? AND `available_status` ='A' AND `facereg_filename` !=''";
  dbConnection.execute(querylistofBoxess
    ,[currentCabinetID ])
    .then(([rows]) => {
      if (rows !== 'undefined'){
           //RESPOSNSE Raw;
            res.status(200).send(rows);
      }else{
        res.status(200).json({ 
          validation:'no',
          msg:'record not found',
       });
        console.log('No record in result Method list_of_faceFile');}
  }).catch(err => 
    res.status(200).json({ 
      validation:'no',
      msg:'record not found',
   }));
};

//list of ALL boxes for current cabinet client (FOR UNLOCKing PURPOSE)
const list_ALL_localCabinetboxess = (req, res) => {
  var currentCabinetID = getTokenID(req.headers.authorization);
  var querylistofBoxess = "SELECT `box_id` FROM `boxes` WHERE `cabinet_fk` =?";
  dbConnection.execute(querylistofBoxess
    ,[currentCabinetID ])
    .then(([rows]) => {
      if (rows !== 'undefined'){
            res.status(200).json({ 
              rows
           });
      }else{console.log('No record in result or Error during Method list_of_boxess');}
  }).catch(err => 
    res.status(200).json({ 
      validation:'no',
      msg:'record not found',
   }));
};

//list of (E)mpty boxes for Selected destination (FOR RESERVE & ALLOCATE) 
const list_of_targetCabinetboxess = (req, res) => {
  var  cabinetId  = req.params.cabinetid || '0';
  console.log("req.params.cabinetid :"+req.params.cabinetid);
  var currentCabinetID = getTokenID(req.headers.authorization);
  if (cabinetId !=="null" && Number(cabinetId)){
    var querylistofBoxess = "SELECT `box_id` FROM `boxes` WHERE `cabinet_fk` =? AND `available_status` ='E' AND `cabinet_fk` !=?";
    dbConnection.execute(querylistofBoxess
      ,[cabinetId, currentCabinetID ])
      .then(([rows]) => {
        if (rows !== 'undefined'){
              res.status(200).json({ 
                rows
            });
        }else{console.log('No record in result or Error during Method list_of_targetCabinetboxess');}
    }).catch(err => 
      res.status(200).json({ 
        validation:'no',
        msg:'record not found'
    }));
  }else{
    res.status(200).json({ 
      msg:'Failed'
    });
  }
};

//list_of_locations (except current client id) 
const listofLocations =(req, res) => {
  var currentCabinetID = getTokenID(req.headers.authorization);  
  console.log("Session of currentCabinetID > "+currentCabinetID);          
  var querylistofLocation = "SELECT `cabinet_id`, `location_name`,`cabinet_addr` FROM `cabinet_set` WHERE `cabinet_id` <>?";//Query number 2
  dbConnection.execute(querylistofLocation
    ,[currentCabinetID])
    .then(([rows]) => {   
      if (rows !== 'undefined'){
          console.log("querylistofLocation runned once"+ JSON.stringify(rows));
          console.log(rows);
            res.status(200).json({ 
             rows
           });
      }else{console.log('No record in result or Error during listofLocation');}
  }).catch(err => 
    res.status(200).json({ 
      validation:'no',
      msg:'record not found'
   }));
};

//for exctraction and getting the Session ID from Token
function getTokenID (passtoken) {
      var clientId ="";
      //console.log("passtoken : "+passtoken);
      if (passtoken) {
        var authorization = passtoken.split(' ')[1],decoded;
        try {
            decoded = jwt.verify(authorization, secret_);
        } catch (e) {
          console.log("error getCurrentTokenID "+decoded);
        }
        console.log("decoded.cabinet_id : "+decoded.cabinet_id);
        clientId = decoded.cabinet_id;
        return clientId;
    }else{ return false; }
};

//for before transfer the first scann for the first box by the staff
function updateTrasnferHandlingSetTime(transferID){
  console.log("Running updateTrasnferHandlingSetTime");
  dbConnection.execute("UPDATE `transfer_allocation` SET `handling_time`=now() WHERE `acquire_id`=?"
  ,[transferID])
  .then(([rows]) => {
    console.log("updateTrasnferHandlingSetTime row affected> "+rows.affectedRows);     
  }).catch(err => {
      if (err) throw err;
      if (err){
          console.log('Error during updateTrasnferHandlingSetTime');
      }
  });
}

//(for after transfer)
//method sent mail to notify user parcel was sented to target location
async function NotifyEmailforParcelReached(serviceID, customerEmail, expdate, locationA, boxAid,
                                             boxAaddr, locationB, boxBid, boxBaddr, lateYesNo){
  var htmlstruc = "From Smart Cabinet System";
  if (lateYesNo =="Yes"){
    var dt = new Date();
    dt.setHours( dt.getHours() + 2 );

    htmlstruc = "<h3>Hi, your 📦 parcel been success reached to ✨boxid: "+boxBid+"✨</h3>"+
    "<h4>Currently your parcel had placed at 📍</h4>"+
    "<h4>Destination address: "+boxBaddr+" ✔️</h4>"+
    "<h4>Destination name: "+locationB+" ✔️</h4>"+
    "<h4>Destination boxID: "+boxBid+" ✔️</h4>"+
    "<h4>Box Expiration: "+dt+" ✔️⏰</h4>"+
    "<h5>Sorry that the parcel been late reaching the expire time been added 2 hours.</h5>"+
    "<h5>Transfer from previous location: "+locationA+"</h5>"+
    "<h5>previous address: "+boxAaddr+"</h5>"+
    "<h5>Previous Cabinet boxid: "+boxAid+"</5>";
    //haven't add time yet
  }else if(lateYesNo =="no"){
    htmlstruc = "<h3>Hi, your 📦 parcel been success reached to ✨boxid: "+boxBid+"✨</h3>"+
    "<h4>Currently your parcel had placed at 📍</h4>"+
    "<h4>Destination address: "+boxBaddr+" ✔️</h4>"+
    "<h4>Destination name: "+locationB+" ✔️</h4>"+
    "<h4>Destination boxID: "+boxBid+" ✔️</h4>"+  
    "<h4>Box Expiration: "+expdate+" ✔️⏰</h4>"+
    "<h5>Remember take away the belongings before expire reach.</h5>"+
    "<h5>Transfer from previous location: "+locationA+"</h5>"+
    "<h5>previous address: "+boxAaddr+"</h5>"+
    "<h5>Previous Cabinet boxid: "+boxAid+"</5>";
  }
  // send mail with defined transport object
  let info = await transporter.sendMail({
    attachDataUrls: true,//to accept base64 content in messsage
    from: '"📪Smart Cabinet Malaysia" <smartcabinetmalaysia.com>', // sender address
    to: customerEmail, // list of receivers
    subject: "Hello ✔ From Smart Cabinet Malaysia", // Subject line
    text: "Your parcel has delivered to target destination > "+locationB, // plain text body
    html: htmlstruc // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}

//Update box_servicing SET complete_time (for after transfer)
function setTransferCompleteOnBoxServ(servicingID, vlate){
  console.log("Running setTransferCompleteOnBoxServicing");
  var setTransferComplete ="";
  if (vlate =="no"){
    console.log("value late> "+vlate);
    setTransferComplete = "UPDATE `box_servicing` SET `transfer_complete`='1' WHERE `service_id`=?";
  }else{
    console.log("value late> "+vlate);
    setTransferComplete = "UPDATE `box_servicing` SET `transfer_complete`='1',`expire_datetime`=DATE_ADD(now(),interval 2 hour) WHERE `service_id`=?";
  }

  dbConnection.execute(setTransferComplete
  ,[servicingID])
  .then(([rows]) => {
    console.log("setTransferCompleteOnBoxServ row affected> "+rows.affectedRows); 
  }).catch(err => {
      if (err) throw err;
      if (err){
          console.log('error Handling value set complete value to servicingID> '+ servicingID);
      }
  });
}

//Update transfer_allocation SET transfer complete datetime value (for after transfer)
function setTransferCompleteOn_TAllocation(transferAquireID){
  console.log("Running setTransferCompleteOn_TAllocation: "+transferAquireID);
  dbConnection.execute("UPDATE `transfer_allocation` SET `complete_time`=now(), `transfer_status`='Success'  WHERE `acquire_id`=?"
  ,[transferAquireID])
  .then(([rows]) => {
    console.log("setTransferCompleteOn_TAllocation row affected> "+rows.affectedRows); 
  }).catch(err => {
      if (err) throw err;
      if (err){
          console.log('error Handling value set complete time on transferID> '+ transferAquireID);
      }
  });
}

//set the localbox to Empty after transfered (for after transfer)
function setEmptytoLocalBox(ttheBoxID){
  console.log("Running setEmptytoLocalBox bid: "+ttheBoxID);
  dbConnection.execute("update `boxes` set `available_status`='E',`customerpass_qr`='',`staffpass_qr`='',`self_reserving`=0,`reserved_by_otherBox`=0,`reservedbyother_box_f_k`=NULL WHERE `box_id`=? AND `available_status`='A'"
  ,[ttheBoxID])
  .then(([rows]) => {
    console.log("setEmptytoLocalBox row affected> "+rows.affectedRows);     
  }).catch(err => {
      if (err) throw err;
      if (err){
          console.log('error Handling value set setEmptytoLocalBox> '+ ttheBoxID);
      }
  });
}

//set the tergetbox to self reserve (for after transfer)
function settargetboxtoSelfReserve(boxID){
  console.log("Running settargetboxtoSelfReserve bid: "+boxID);
  dbConnection.execute("UPDATE `boxes` SET `staffpass_qr`='',`self_reserving`='1',`reserved_by_otherBox`='0',`reservedbyother_box_f_k`=NULL WHERE `box_id`=?"
  ,[boxID])
  .then(([rows]) => {    
    console.log("settargetboxtoSelfReserve row affected> "+rows.affectedRows);
  }).catch(err => {
      if (err) throw err;
      if (err){
          console.log('error Handling value set settargetboxtoSelfReserve> '+ boxID);
      }
  });
}

//Ping server to test server is alive
const niHao = (req, res) => {
  var currentSessionID = getTokenID(req.headers.authorization);
  res.status(200).json("ni hao ma:" + currentSessionID );
};

const cancel_reserved_box = (req, res) => {
  console.log("req.body "+JSON.stringify(req.body));
  const { errors, isValid } = validateCancelReservedBox(req.body);

  // check validation
  if(!isValid) {
    return res.status(400).json(errors);
  }

  var boxID1 = req.body.localboxID ;
  var boxID2= req.body.targetboxID ;
  console.log("boxID1: "+boxID1 +" boxID2: "+boxID2);
  
  var currentCabinetID = getTokenID(req.headers.authorization);
  if (boxID2 != null){
    cancel_reserve_both(res, boxID1, boxID2, currentCabinetID);
  }else{
    methodSetLocalboxToEmpty(res, boxID1, boxID2, currentCabinetID);
  }
};

//method set local box to empty (cancel reserving)
function methodSetLocalboxToEmpty(res, boxId,boxId2, currentCabinetID){
  console.log("methodSetLocalboxToEmpty runned once"+" boxid "+ boxId+" boxid2 "+boxId2);
  var querysetBacktoEmptyForLocalBox = "UPDATE `boxes` SET `available_status`='E',`self_reserving`='0',`reserved_by_otherBox`='0',`reservedbyother_box_f_k`=NULL WHERE `box_id`=? AND `cabinet_fk`= ? AND `available_status`='R'";
  dbConnection.execute(querysetBacktoEmptyForLocalBox
    ,[boxId, currentCabinetID])
    .then(([rows]) => {
      if (rows.affectedRows == 1){
          console.log("methodSetLocalboxToEmpty row affected> "+rows.affectedRows);
          if (boxId2 ==null){
            res.status(200).json({ });
          }else{res.status(200).json({ });}
      }else{res.status(200).json({ });}
  }).catch(err => 
    res.status(200).json({ 
      validation:'no',
      msg:'record not found',
      error: err
    }));
}

//cancel_reserve_both (trigger while after goingback to the Main page)
function cancel_reserve_both (res, localboxID, targetboxID, currentCabinetID) {
  console.log("cancel_reserve_both runned once"+" boxid "+ localboxID+" boxid2 "+targetboxID);
  methodSetLocalboxToEmpty(res, localboxID,targetboxID, currentCabinetID);
  var setBacktoEmptyForTargetBox = "UPDATE `boxes` SET `available_status`='E',`self_reserving`='0',`reserved_by_otherBox`='0',`reservedbyother_box_f_k`=NULL WHERE `box_id`=? AND `reservedbyother_box_f_k`= ? AND `available_status`='R'";
  dbConnection.execute(setBacktoEmptyForTargetBox
    ,[targetboxID, localboxID ])
    .then(([rows]) => {
      if (rows.affectedRows == 1){
            console.log("cancel_reserve_both row affected> "+rows.affectedRows);
            res.status(200).json({ });
      }else{res.status(200)}
  }).catch(err => 
    res.status(200).json({ 
      validation:'no',
      msg:'record not found',
      error: err
   }));
};

export { 
    login, 
    findAllClient,
    niHao,
    unlockforcustomer,
    unlockforcustomerwithface,
    unlockbeforetransfer,
    unlockaftertransfer,
    box_itself_reserve,
    box_reserve_another_box,
    cancel_reserved_box,
    list_ALL_localCabinetboxess,
    list_of_localCabinetboxess,
    list_of_targetCabinetboxess,
    listofLocations,
    list_of_faceFile_in_allocatedBox,
    confirm_payment 
}

