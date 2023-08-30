const express = require('express');
const path = require('path');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const dbConnection = require('./database');
const { body, validationResult } = require('express-validator');
const cryptoRandomString = require('crypto-random-string');

var transferStatus ="awaiting to next";
var transferId = "Proceed to NEW task~";

const app = express();
app.use(express.static(__dirname+'/public'));
app.use(express.urlencoded({extended:false}));

// SET OUR VIEWS AND VIEW ENGINE
app.set('views', path.join(__dirname,'views'));
app.set('view engine','ejs');

// APPLY COOKIE SESSION MIDDLEWARE
app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
    maxAge:  3600 * 1000 // 1hr
}));

// DECLARING CUSTOM MIDDLEWARE
const ifNotLoggedin = (req, res, next) => {
    if(!req.session.isLoggedIn){
        return res.render('login-register');
    }
    next();
}

const ifLoggedin = (req,res,next) => {
    if(req.session.isLoggedIn){
        return res.redirect('/home');
    }
    next();
}
// END OF CUSTOM MIDDLEWARE

app.get( '/public/qrcode.js', function( req, res ) {
    res.sendFile( path.join( __dirname, 'public', 'qrcode.js' ));
});

app.get( '/public/jquery.min.js', function( req, res ) {
    res.sendFile( path.join( __dirname, 'public', 'jquery.min.js' ));
});

app.get( '/public/homeqr.js', function( req, res ) {
    res.sendFile( path.join( __dirname, 'public', 'homeqr.js' ));
});

// ROOT PAGE
//previous query > SELECT `staff_name` FROM `staff` WHERE `staff_id`=?
app.get('/', ifNotLoggedin, (req,res,next) => {
    dbConnection.execute("SELECT A.`localbox_fkid` , A.`targetbox_fkid` , B.`transfer_status`, B.`acquire_id`, C.`staffpass_qr`, D.`staffpass_qr` AS `staffpass_qr2`, E.`staff_name` ,F.`cabinet_addr`, G.`cabinet_addr` AS `cabinet_addr2` FROM `box_servicing` AS A INNER JOIN `transfer_allocation`AS B ON B.`box_servicing_fk` = A.`service_id` INNER JOIN `boxes` AS C ON C.`box_id` = A.`localbox_fkid` INNER JOIN `boxes` AS D ON D.`box_id` = A.`targetbox_fkid` INNER JOIN `staff` AS E ON B.`staff_fkid` = E.`staff_id`  INNER JOIN `cabinet_set` AS F ON F.`cabinet_id` = C.`cabinet_fk` INNER JOIN `cabinet_set` AS G ON G.`cabinet_id` = D.`cabinet_fk` WHERE B.`staff_fkid` = ? ORDER BY B.`acquire_time` DESC LIMIT 1",[req.session.userID])
    .then(([rows]) => {
        console.log("Runned once");
        console.log(rows[0]);
        var transferID, t_status, qrPass1, qrPass2, boxID1, boxID2, boxAddr1, boxAddr2;
        transferId = "Gather New Task~";
        if (rows.length > 0){
            transferID = (typeof rows[0].acquire_id !== "undefined") ? rows[0].acquire_id : "Gather New Task~";
            t_status = (rows[0].transfer_status !=="") ? rows[0].transfer_status : "None";
            qrPass1 = (rows[0].transfer_status =="Pending") ? rows[0].staffpass_qr : "None";
            qrPass2 = (rows[0].transfer_status =="Pending") ? rows[0].staffpass_qr2 : "None";
            boxID1 = (rows[0].localbox_fkid !=="") ? rows[0].localbox_fkid : "None";
            boxID2 = (rows[0].targetbox_fkid !== "") ? rows[0].targetbox_fkid : "None";
            boxAddr1 = (rows[0].cabinet_addr !=="") ? rows[0].cabinet_addr : "None";
            boxAddr2 = (rows[0].cabinet_addr2 !== "") ? rows[0].cabinet_addr2 : "None";

            var jsonQRpass1 = JSON.stringify({
                tid: transferID,
                bqr: qrPass1
            }) ;

            var jsonQRpass2 = JSON.stringify({
                tid: transferID,
                aqr: qrPass2
            }) ;

            res.render('home',{
                name: req.session.userName,//rows[0].staff_name,
                transfer_status: t_status,
                transfer_id : transferID,
                qrbox1:jsonQRpass1,
                qrbox2:jsonQRpass2,
                boxID1:boxID1,
                boxID2:boxID2,
                bAddr1:boxAddr1,
                bAddr2:boxAddr2
            });
        }else{
            res.render('home',{
                name: req.session.userName,//rows[0].staff_name,
                transfer_status: t_status,
                transfer_id : transferID,
                qrbox1:qrPass1,
                qrbox2:qrPass2,
                boxID1:boxID1,
                boxID2:boxID2,
                bAddr1:boxAddr1,
                bAddr2:boxAddr2
            });
        }
    });
});// END OF ROOT PAGE


// REGISTER PAGE
app.post('/register', ifLoggedin, 
// post data validation(using express-validator)
[
    body('user_email','Invalid email address!').isEmail().custom((value) => {
        return dbConnection.execute('SELECT `staff_email` FROM `staff` WHERE `staff_email`=?', [value])
        .then(([rows]) => {
            if(rows.length > 0){
                return Promise.reject('This E-mail already in use!');
            }
            return true;
        });
    }),
    body('user_name','Username is Empty!').trim().not().isEmpty(),
    body('user_pass','The password must be of minimum length 6 characters').trim().isLength({ min: 6 }),
],// end of post data validation
(req,res,next) => {

    const validation_result = validationResult(req);
    const {user_name, user_pass, user_email} = req.body;
    // IF validation_result HAS NO ERROR
    if(validation_result.isEmpty()){
        // password encryption (using bcryptjs)
        bcrypt.hash(user_pass, 12).then((hash_pass) => {
            // INSERTING USER INTO DATABASE
            dbConnection.execute("INSERT INTO `staff`(`staff_name`,`staff_email`,`staff_pass`) VALUES(?,?,?)",[user_name,user_email, hash_pass])
            .then(result => {
                res.send(`your account has been created successfully, Now you can <a href="/">Login</a>`);
            }).catch(err => {
                // THROW INSERTING USER ERROR'S
                if (err) throw err;
            });
        })
        .catch(err => {
            // THROW HASING ERROR'S
            if (err) throw err;
        })
    }
    else{
        // COLLECT ALL THE VALIDATION ERRORS
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        // REDERING login-register PAGE WITH VALIDATION ERRORS
        res.render('login-register',{
            register_error:allErrors,
            old_data:req.body
        });
    }
});// END OF REGISTER PAGE

// LOGIN PAGE
app.post('/', ifLoggedin, [
    body('user_email').custom((value) => {
        return dbConnection.execute('SELECT `staff_email` FROM `staff` WHERE `staff_email`=?', [value])
        .then(([rows]) => {
            if(rows.length == 1){
                return true;      
            }
            return Promise.reject('Invalid Email Address!');       
        });
    }),
    body('user_pass','Password is empty!').trim().not().isEmpty(),
], (req, res) => {
    const validation_result = validationResult(req);
    const {user_pass, user_email} = req.body;
    if(validation_result.isEmpty()){
        
        dbConnection.execute("SELECT * FROM `staff` WHERE `staff_email`=?",[user_email])
        .then(([rows]) => {
            // console.log(rows[0].password);
            bcrypt.compare(user_pass, rows[0].staff_pass).then(compare_result => {
                if(compare_result === true){
                    req.session.isLoggedIn = true;
                    req.session.userID = rows[0].staff_id;
                    req.session.userName = rows[0].staff_name;
                    res.redirect('/');
                }
                else{
                    res.render('login-register',{
                        login_errors:['Invalid Password!']
                    });
                }
            })
            .catch(err => { // catch for bcrypt function
                if (err) throw err;
            });
        }).catch(err => {  //catch for query
            if (err) throw err;
        });
    }
    else{
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        // REDERING login-register PAGE WITH LOGIN VALIDATION ERRORS
        res.render('login-register',{
            login_errors:allErrors
        });
    }
});
// END OF LOGIN PAGE

// LOGOUT
app.get('/logout',(req,res)=>{
    //session destroy
    req.session = null;
    res.redirect('/');
});
// END OF LOGOUT

//Cancel current transfer task
app.post('/canceltask', ifNotLoggedin, function(req, res){
    //var req_transferID=req.body.tansfer_id;
    dbConnection.execute("SELECT * FROM `transfer_allocation` WHERE `staff_fkid` =? AND `transfer_status` = 'Pending' AND `handling_time` IS NULL ORDER BY `acquire_id` DESC LIMIT 1"
    ,[req.session.userID])
    .then(([rows]) => {
        //console.log(rows[0]);
        if (rows.length > 0){
            bs_id = rows[0].box_servicing_fk;
            transferID_ = rows[0].acquire_id;
            console.log('row found');
            console.log('box_servicing ID> '+bs_id);
            console.log("transfer acquire ID> "+transferID_);
            setTransferHandlingToZero(bs_id);
            cancelTheCurrentAquiredTask(transferID_);
            res.redirect('/');
        }else{
            console.log('No result for current pending transfer');
            res.redirect('/');
        }
    }).catch(err => {
        if (err) throw err;
    });
});

//gather new task
app.get('/gathertask',ifNotLoggedin, function(req, res){
    dbConnection.execute("SELECT * FROM `transfer_allocation` WHERE `staff_fkid`= ? order by `acquire_id` DESC LIMIT 1"
    ,[req.session.userID])//,[]
    .then(([rows]) => {
        
        if (rows.length > 0){
            console.log("taken task(s) before");
            if(rows[0].transfer_status=='Pending'){
                console.log('Not finishing current task');
                console.log('Current task still need to be done/cancel~');
                res.redirect('/');
            }else{
                console.log('no latest Pending task, seeking and acquiring new task');
                checkNewTransferQuest(req.session.userID);
                res.redirect('/');
            }

            res.status(404).send(String(rows[0].acquire_id)); //gathered_serviceID   
        }else{
            console.log('No record for transfer allocation, seeking and acquiring new task');
            checkNewTransferQuest(req.session.userID);
            res.redirect('/');
            return;
        }    
    }).catch(err => {
        if (err) throw err;
    });
});
//end of gather new task

app.get('/count_total_newtask', ifNotLoggedin, function(req, res){
    //var req_transferID=req.body.tansfer_id;
    dbConnection.execute("SELECT COUNT(`service_id`) AS countts FROM `box_servicing` WHERE `transfer_handling`=0 AND `transfer_complete`=0 AND `service_type`='T_S'"
    ,[req.session.userID])
    .then(([rows]) => {
        //console.log(rows[0]);
        if (rows.length > 0){
            tscount = rows[0].countts;
            res.status(200).send((tscount).toString());
        }else{
            console.log('No result for T_S count');
            res.status(200).send('0');
        }

    }).catch(err => {
        if (err) throw err;
    });
});

//method for insert new task to tansfer allocation table
function addRowTotransfrAllocation(dataStaffID, box_servicingID) {
    dbConnection.execute("INSERT INTO `transfer_allocation` ( `staff_fkid`, `box_servicing_fk`, `transfer_status`, `acquire_time`) VALUES ( ?, ?, 'Pending', current_timestamp())"
    ,[dataStaffID, box_servicingID])
    .then(([rows]) => {
    }).catch(err => {
        if (err) throw err;
        if (!err){
            console.log('row inserted');
            //console.log(transferID_);
            return row[0];
        }else{
            console.log('Error during inserting row to transfer allocation');
            return undefined;
        }
    });
}

//method UPDATE boxstaff_qr string
function update_staffQR(boxID){
    var randomHash = cryptoRandomString({length: 20, type: 'alphanumeric'});
    //UPDATE `boxes` SET `customerpass_qr`='abc12345' WHERE `box_id`= 1
    dbConnection.execute("UPDATE `boxes` SET `staffpass_qr`=? WHERE `box_id`= ?"
    ,[randomHash, boxID])
    .then(([rows]) => {
    }).catch(err => {
        if (err) throw err;
        if (!err){
            console.log('staff QR updated'+ boxID);
            //console.log(transferID_);
            return row[0];
        }else{
            console.log('Error during updating row to boxes for staff qr string');
            return undefined;
        }
    });
}

//check current transfer details (after acquired task) RETRIEVE QR PASS
function retrieveCurretTaskWithQR(StaffID, t_acquireID){
    console.log("StaffID>: "+StaffID);
    console.log("t_acquireID>: "+t_acquireID);
    var queryCurrentTask = "SELECT A.`localbox_fkid` , A.`targetbox_fkid` , B.`transfer_status`, B.`acquire_id`, C.`staffpass_qr`, D.`staffpass_qr` AS `staffpass_qr2` , E.`cabinet_addr`, F.`cabinet_addr` AS `cabinet_addr2` FROM `box_servicing` AS A INNER JOIN `transfer_allocation` AS B ON B.`box_servicing_fk` = A.`service_id` INNER JOIN `boxes` AS C ON C.`box_id` = A.`localbox_fkid` INNER JOIN `boxes` AS D ON D.`box_id` = A.`targetbox_fkid` INNER JOIN `cabinet_set` AS E ON E.`cabinet_id` = C.`cabinet_fk` INNER JOIN `cabinet_set` AS F ON F.`cabinet_id` = D.`cabinet_fk` WHERE B.`staff_fkid` = ? AND B.`acquire_id` = ? ORDER BY B.`acquire_time` DESC LIMIT 1";
    dbConnection.execute(queryCurrentTask
    ,[StaffID, t_acquireID])
    .then(([rows]) => {
        //console.log(row[0]);
        if (rows.length > 0){
            transferStatus = rows[0].transfer_status;
            transferID_ = rows[0].acquire_id;
            console.log("retrieveCurretTask runned once");
            console.log(rows[0]);
            //console.log(transferID_);
            return rows[0];
            res.render('home',{
                name:req.session.userName,
                transfer_status:transferStatus,
                transfer_id : transferID_
            });
        }else{
            console.log('No record in result or Error during Method retrieveCurretTaskWithQR');
            return undefined;
        }
        console.log(rows[0])
    }).catch(err => {
        if (err) throw err;
    });
}

//Method update the servicing table for transfer_handling (status)
function setTransfer_handling(servicingID){
    dbConnection.execute("UPDATE `box_servicing` SET `transfer_handling`=1 WHERE `service_id` =  ?"
    ,[servicingID])
    .then(([rows]) => {
        if (rows !== 'undefined'){
            console.log('transfer_handling updated'+ servicingID);
        }else{
            console.log('Error during updating row to box_servicing for transfer_handling');
            return undefined;
        }
    }).catch(err => {
        if (err) throw err;
    });
}

//Method check current transfer status
function checkCurrentTransfer(staffID){
    console.log("running checkCurrentTransfer");
    return dbConnection.execute("SELECT * FROM `transfer_allocation` WHERE `staff_fkid`= ? order by `acquire_id` DESC LIMIT 1"
    ,[staffID])
    .then(([rows]) => {
        if (rows.length > 0){
            console.log('Current transfer(`box_servicing`) >'+ rows[0].acquire_id);
            retrieveCurretTaskWithQR(staffID, rows[0].acquire_id)
            return rows[0];
        }else{
            console.log('Error during Select at method checkCurrentTransfer');
            return undefined;
        }
    }).catch(err => {
        if (err) throw err;
    });
}

//Method to check Latest Transfer task from box_service
function checkNewTransferQuest(staffID){
    console.log("running checkCurrentTransfer");
    //Find out the latest Transfer need from box_servicing table
    dbConnection.execute("SELECT * FROM `box_servicing` WHERE `service_type` = 'T_S' AND `transfer_handling` = 0 AND `transfer_complete` = 0   LIMIT 1" 
    // discard check on condition  of `expire_datetime` > CURRENT_TIMESTAMP()
    //let the service able to continue even expired
    )//,[staffID]
    .then(([rows]) => {
        if (rows.length > 0){
            console.log('New quest await to transfer from (`box_servicing`) >'+ rows[0].service_id);
            //insert new task to tansfer allocation table
            addRowTotransfrAllocation(staffID, rows[0].service_id);
            update_staffQR(rows[0].localbox_fkid); // update qr string for local box
            update_staffQR(rows[0].targetbox_fkid); // update qr string for target box
            setTransfer_handling(rows[0].service_id);//set transfer handling status
            checkCurrentTransfer(staffID);//retrieve info to show detail on page
            //console.log(rows[0]);
            return rows[0];
        }else{
            console.log('No result for transfer need from box_servicing');
            return undefined;
            res.render('home',{
                name:req.session.userName
            });
        }
    }).catch(err => {
        if (err) throw err;
    });
}

//method to retrive the hash to unlock
function retrieveBoxQRPassforStaff(boxID){
    console.log("Running retrieveBoxQRPassforStaff");
    dbConnection.execute("SELECT `staffpass_qr` FROM `boxes` WHERE `box_id`=?"
    ,[boxID])
    .then(([rows]) => {        
        if (rows.length > 0){
            console.log('staff QR for boxID :'+ boxID);
            return rows[0];
        }else{
            console.log('Error during SELECT boxes for staff qr string');
            return undefined;
        }
    }).catch(err => {
        if (err) throw err;
    });
}

//function to set transfer handling back to 0  from table box_servicing
//(means transfer not handling by anyone currently)
function setTransferHandlingToZero(boxServicingID){
    console.log("Running setTransferHandlingToZero");
    dbConnection.execute("UPDATE `box_servicing` SET `transfer_handling`=0 WHERE `service_id`=? AND `transfer_handling` =1"
    ,[boxServicingID])
    .then(([rows]) => {        
    }).catch(err => {
        if (err) throw err;
        if (!err){
            console.log('Handling value reset back to 0 box_servicingID> '+ boxServicingID);
        }else{
            console.log('Error during updating row to boxes for staff qr string');
        }
    });
}

//function to cancel the current task (allow only before handling made [scanned with first' box Qr code])
function cancelTheCurrentAquiredTask(transferID_){
    console.log("Running cancelTheCurrentAquiredTask >ID "+transferID_);
    dbConnection.execute("UPDATE `transfer_allocation` SET `transfer_status`='Cancelled',`cancelled_time`=CURRENT_TIMESTAMP WHERE `acquire_id`= ?"
    ,[transferID_])
    .then(([rows]) => {        
    }).catch(err => {
        if (err) throw err;
        if (!err){
            console.log('Cancelling current task from transfer allocation > ID'+ transferID_);
        }else{
            console.log('Error during Cancelling current task');
        }
    });
}

app.use('/', (req,res) => {
    res.status(404).send('<h1>404 Page Not Found!</h1>');
});

app.listen(5000, () => console.log("Server is Running...port 5000"));