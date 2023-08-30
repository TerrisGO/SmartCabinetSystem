make sure the mysql database was imported the database file
and set the 3 procedure to run with scheduler(events > Event scheduler status set to On)

1. procedure update_end_local_store_serv  > every 5 minutes
2. procedure update_end_transfer_store_serv > every 5 minutes
3. procedure clear_expired_reserved_boxes >  every 1 minutes

Install package using commands
npm install package.json
npm install -g nodemon --save
npm install -g babel-cli --save
npm install -g babel-preset-env --save

(after installed all required package)
runn>>
nodemon --exec babel-node src/index.js



