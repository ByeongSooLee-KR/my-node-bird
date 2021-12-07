const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const bcrypt = require('bcrypt');
const { User } = require('../models');

module.exports = () => {
    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password', // 첫번째가 req.body에 대한 설정이라면 두 번째 인자는 그에대한 함수 설정 
    }, async (email, password, done) => { // 두번째 인자에서 로그인 전략을 세운다. 
        try {
            const user = await User.findOne({
                where: { email }
            });
            if(!user) { // passport에서는 응답을 바로 주지 않고 done으로 판단할 수 있게 보내준다. 
                return done(null, false, { reason: '존재하지 않는 이메일입니다!' }); // 서버에러, 성공여부, 클라이언트에러 순서이다.
            }
            const result = await bcrypt.compare(password, user.password);
            if(result) {
                return done(null, user);
            }
            return done(null, false, { reason: '비밀번호가 틀렸습니다.'});
            }
        catch (error) {
            console.error(error);
            return done(error);
        }

    }));
};
