import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'//require jwt
import models from '../models'// require model

const Client = models.cabinet_set;// require the model of client
let secret_ = process.env.SECRET || "SECERT";//default key
const opts = {};//creat new option object
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();//read bearer
opts.secretOrKey = secret_;//encryption key to decode the message within the key

// create jwt strategy
module.exports = passport => { //export the passport call
  passport.use("strategyClient",//verify these credentials with the database
    new JwtStrategy(opts, (jwt_payload, done) => {//decode the message from JWT
        Client.findAll({ where: { cabinet_id: jwt_payload.cabinet_id } })
        .then(client => {
          if (client.length) {//if the client exist
            return done(null, client);// return true
            console.log("client valid "+client)
          }
          return done(null, false);//else return false
        })
        .catch(err => console.log(err));//catch error
    })
  );
};
