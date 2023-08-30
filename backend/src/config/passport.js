import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'
import models from '../models'

const Admins = models.Admin;
let secret_ = process.env.SECRET || "SECERT";
const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = secret_;
// opts.issuer = 'accounts.examplesoft.com';
// opts.audience = 'yoursite.net';

// create jwt strategy
module.exports = passport => {
  passport.use("strategyAdmin",
    new JwtStrategy(opts, (jwt_payload, done) => {
      Admins.findAll({ where: { id: jwt_payload.id } })
        .then(user => {
          if (user.length) {
            return done(null, user);
          }
          return done(null, false);
        })
        .catch(err => console.log(err));
    })
  );
};
